# Architectural Patterns

## State Management: Context + useReducer

All game state lives in a single `GameState` object managed by a React Context pair:
- `GameContext` — read-only state
- `GameDispatchContext` — dispatch actions

Source: `src/game/store.tsx:1-135`

**Consuming state in components:**
```
const state = useGameState();        // src/game/store.tsx
const dispatch = useGameDispatch();  // src/game/store.tsx
```

Both hooks throw if used outside `<GameProvider>`. All components use hooks — no prop drilling.

**Reducer actions** (all defined in `src/game/store.tsx`):
- `NEW_GAME` — initialize with preset + maxRounds
- `START_GAME` — run year-0 elections, set status to `IN_PROGRESS`
- `SCHEDULE_POLL` / `CANCEL_POLL` — queue/dequeue a poll for the human player (no coins spent yet)
- `DISMISS_POLL_RESULTS` — clear the post-phase results panel
- `CAMPAIGN` — spend coins, mutate state data (requires `stateIndex` + `attributeIndex`)
- `END_PHASE` — execute scheduled polls (deducting coins), mark human ready, run AI turns, call `advancePhase()`
- `SET_MESSAGE` — update status bar text

---

## Game Logic Modules (no React)

All game logic lives in `src/game/` as plain TypeScript modules with no React imports. Each module owns one subsystem:

| Module | Responsibility | Source |
|---|---|---|
| `types.ts` | All types, enums, constants, ideology presets | `src/game/types.ts` |
| `setup.ts` | `createGame()` — full initial `GameState` | `src/game/setup.ts` |
| `engine.ts` | `advancePhase()`, `playerReady()`, `startGame()` | `src/game/engine.ts` |
| `voters.ts` | `calculateVoteShares()` — GAP-weighted ideology scoring | `src/game/voters.ts` |
| `elections.ts` | D'Hondt, plurality, multi-winner election runners | `src/game/elections.ts` |
| `calendar.ts` | `getElectionsForYear()` — 12-year cycle lookup | `src/game/calendar.ts` |
| `economy.ts` | `distributeIncome()` — tier-based post-election funding | `src/game/economy.ts` |
| `perception.ts` | `applyPerceptionDrift()` — 10% drift toward reality per round | `src/game/perception.ts` |
| `scoring.ts` | `computeSpearmanScores()` — final ideology-vs-reality ranking | `src/game/scoring.ts` |
| `polls.ts` | `executePoll(game, playerIndex, stateIndex, attributeIndex)` — spend coins, reveal single-attribute data for all parties | `src/game/polls.ts` |
| `campaigns.ts` | `executeCampaign()` — spend coins, boost perceived ideology | `src/game/campaigns.ts` |
| `ai.ts` | `executeAllAITurns()` — random poll/campaign actions | `src/game/ai.ts` |

---

## Immutable State Updates via `structuredClone`

The reducer never mutates state in place. Before passing `GameState` to any engine function, it deep-clones:

```typescript
// src/game/store.tsx (reducer)
const newState = structuredClone(state);
advancePhase(newState);
return newState;
```

Engine functions (`advancePhase`, `executePoll`, etc.) receive and mutate the clone directly — they do **not** return a new object. This pattern is consistent across all reducer cases.

---

## Phase State Machine

The game loop is a linear phase sequence managed in `src/game/engine.ts:advancePhase()`:

```
POLLS → CAMPAIGNS → PROJECTS (stub) → ELECTIONS → ROUND_END → (next year POLLS)
```

`playerReady()` marks the human done and immediately runs AI turns for the current phase before calling `advancePhase()`. The `PROJECTS` phase is defined in types but skipped by the engine (`src/game/engine.ts`).

---

## Component Hierarchy

```
page.tsx (Home)
└── GameProvider (store.tsx)
    ├── SetupScreen          — preset picker, game length
    └── GameBoard            — orchestrates all in-game UI
        ├── AdminPanel       — dev overlay (toggleable, reads full StoreState)
        ├── Sidebar          — player info, all-party summary, scores
        ├── PollResultsPanel  — post-phase poll results list (shown until dismissed)
        ├── PollPanel        — phase: POLLS
        ├── CampaignPanel    — phase: CAMPAIGNS
        ├── ElectionResults  — phase: ELECTIONS
        ├── Dashboard        — default/ROUND_END view
        │   └── StateCard×6  — per-state attribute bars, offices, deputies
        └── Scoreboard       — status: FINISHED
```

`GameBoard` (`src/components/game/GameBoard.tsx`) renders the correct panel by switching on `state.currentPhase`. All panels call `dispatch(END_PHASE)` when the human finishes their actions.

---

## Dev / Debug Tools

`AdminPanel` (`src/components/game/AdminPanel.tsx`) is a full-screen overlay toggled by an
"Admin" button in the `GameBoard` header. It reads the full `StoreState` via `useGameState()`
and renders four collapsible sections: Game Info, Players, States, and Rounds History.
Visibility is controlled by a local `useState` boolean in `GameBoard` — no store changes needed.

---

## Types as Single Source of Truth

`src/game/types.ts` is the canonical definition file for:
- All interfaces (`GameState`, `PlayerData`, `GameStateData`, `Office`, etc.)
- All enums (`Phase`, `StateSize`, `OfficeType`, `GameStatus`)
- All numeric constants (`POLL_COST`, `CAMPAIGN_COST`, `INITIAL_BUDGET`, etc.)
- Ideology presets (`PRESETS` array with 8 entries)
- Attribute labels (`ATTRIBUTES` array, length 8)

No constants are defined in component or engine files — they import from `types.ts`.

---

## Vote Calculation: GAP-Weighted Ideology

`src/game/voters.ts:calculateVoteShares()` implements the core voting mechanic:

1. Compute per-attribute **gaps** = `expectation − perceivedQuality` (floored at 0)
2. Use gaps as weights — attributes voters feel are **unmet** matter more
3. Score each party: `Σ(weight[attr] × perceivedIdeology[party][attr])`
4. Normalize scores to vote shares (proportional)

This runs inside election logic (`src/game/elections.ts`) for every state.

---

## Electoral Systems

Two systems coexist in `src/game/elections.ts`:

- **D'Hondt proportional** — used for Deputies; allocates seats by iterative highest-quotient (`votes / (seats + 1)`)
- **Plurality / Top-N** — used for Governors (top 1) and Senators (top 2) by raw vote share

The electoral calendar (`src/game/calendar.ts`) maps each year to which office types hold elections, based on a 12-year cycle.
