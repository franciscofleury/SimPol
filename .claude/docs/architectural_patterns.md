# Architectural Patterns

## State Management: Context + useReducer

All game state lives in a single `GameState` object managed by a React Context pair:
- `GameContext` — read-only state
- `GameDispatchContext` — dispatch actions

Source: `src/game/store.tsx`

**StoreState fields** (beyond `game: GameState | null` and `message: string`):
- `scheduledPolls` / `scheduledCampaigns` — queues for the human player's pending actions (coins not yet spent)
- `resultsLog: ResultLogEntry[]` — cumulative log of all executed polls, campaigns, and elections; persists across rounds; entries have `id`, `kind: 'poll' | 'campaign' | 'election'`, and `data` (`PollResult` | `CampaignResult` | `ElectionResult`). Exported type from `store.tsx`.

**Consuming state in components:**
```
const state = useGameState();        // src/game/store.tsx
const dispatch = useGameDispatch();  // src/game/store.tsx
```

Both hooks throw if used outside `<GameProvider>`. All components use hooks — no prop drilling.

**Reducer actions** (all defined in `src/game/store.tsx`):
- `NEW_GAME` — initialize with preset + maxRounds
- `START_GAME` — begin year 0 at POLLS phase; senators and deputies start vacant and are filled by year 0's auto-run elections (at end of CAMPAIGNS); governors are pre-assigned mid-term by `createGame()`
- `SCHEDULE_POLL` / `CANCEL_POLL` — queue/dequeue a poll for the human player (no coins spent yet)
- `SCHEDULE_CAMPAIGN` / `CANCEL_CAMPAIGN` — queue/dequeue a campaign for the human player (no coins spent yet)
- `END_PHASE` — execute scheduled polls and campaigns (deducting coins), append poll/campaign `ResultLogEntry` items to `resultsLog`, mark human ready, run AI turns, call `advancePhase()`; if elections ran (CAMPAIGNS phase in an election year), appends an `'election'` `ResultLogEntry` after phase advance
- `DELETE_RESULT_LOG_ENTRY` — remove a single entry from `resultsLog` by id
- `CLEAR_RESULTS_LOG` — empty the entire results log
- `SET_MESSAGE` — update status bar text

---

## Game Logic Modules (no React)

All game logic lives in `src/game/` as plain TypeScript modules with no React imports. Each module owns one subsystem:

| Module | Responsibility | Source |
|---|---|---|
| `types.ts` | All types, enums, constants, ideology presets | `src/game/types.ts` |
| `setup.ts` | `createGame()` — full initial `GameState`; `initializePerceivedIdeology()` applies ±1.5 random perturbation (clamped ≥ 0) to each star value so voters start with imperfect party perception | `src/game/setup.ts` |
| `engine.ts` | `advancePhase()`, `playerReady()`, `startGame()` | `src/game/engine.ts` |
| `voters.ts` | `calculateVoteShares()` — GAP-weighted ideology scoring | `src/game/voters.ts` |
| `elections.ts` | D'Hondt, plurality, multi-winner election runners | `src/game/elections.ts` |
| `calendar.ts` | `getElectionsForYear()` — 12-year cycle lookup | `src/game/calendar.ts` |
| `economy.ts` | `distributeIncome()` — tier-based post-election funding | `src/game/economy.ts` |
| `perception.ts` | `applyPerceptionDrift()` — 10% drift toward reality per round | `src/game/perception.ts` |
| `scoring.ts` | `computeSpearmanScores()` — final ideology-vs-reality ranking | `src/game/scoring.ts` |
| `polls.ts` | `executePoll()` — spend coins, reveal single-attribute data for all parties; `roundToHalf()` — exported helper rounding to nearest 0.5, applied in display components to limit poll result precision | `src/game/polls.ts` |
| `campaigns.ts` | `executeCampaign()` — spend coins, boost perceived ideology by 0.5; returns `CampaignResult` on success or `null` on failure; records to `player.campaignResults` | `src/game/campaigns.ts` |
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

**Year 0:** The game begins at year 0, POLLS phase. Senators and deputies start vacant; they are filled by year 0's auto-run elections (triggered at the end of CAMPAIGNS, same as all other election years). Governors are pre-assigned at game creation (mid-term: `electedYear: -2`, `expiresYear: 2`). The `ELECTIONS` and `ROUND_END` phases are internal engine states — they are set and immediately advanced within a single `advancePhase()` call, so React only ever renders POLLS or CAMPAIGNS phases during active gameplay.

---

## Component Hierarchy

```
page.tsx (Home)
└── GameProvider (store.tsx)
    ├── SetupScreen          — preset picker, game length
    └── GameBoard            — orchestrates all in-game UI
        ├── AdminPanel        — dev overlay (toggleable, reads full StoreState)
        ├── Sidebar           — player info, all-party summary, scores
        ├── PollPanel         — phase: POLLS (scheduling queue)
        ├── CampaignPanel     — phase: CAMPAIGNS (scheduling queue, mirrors PollPanel)
        ├── ElectionResults   — phase: ELECTIONS
        ├── Dashboard         — default/ROUND_END view
        │   └── StateCard×6   — per-state attribute bars, offices, deputies
        ├── Scoreboard        — status: FINISHED
        └── ResultsLogPanel   — permanent right column; cumulative log of all poll, campaign,
                                and election results; newest-first; per-entry × delete + Clear all
```

`GameBoard` (`src/components/game/GameBoard.tsx`) renders the correct panel by switching on `state.currentPhase`. All panels call `dispatch(END_PHASE)` when the human finishes their actions. `ResultsLogPanel` is always mounted alongside the main content as a sticky right column.

---

## Dev / Debug Tools

`AdminPanel` (`src/components/game/AdminPanel.tsx`) is a full-screen overlay toggled by an
"Admin" button in the `GameBoard` header. It reads the full `StoreState` via `useGameState()`
and renders four collapsible sections: Game Info, Players, States, and Rounds History.
Visibility is controlled by a local `useState` boolean in `GameBoard` — no store changes needed.

The Players section shows each party's ideology as a ranked table (Rank → Attribute → **Stars** → Index), where Stars is the real star value for that rank position (4.0 for rank 1 down to 0.5 for rank 8), sourced from `RANK_TO_STARS`. The States section shows `perceivedIdeology` as a numeric grid — comparing Stars in the player table against perceivedIdeology values in the state grid reveals the initial perception gap.

---

## Types as Single Source of Truth

`src/game/types.ts` is the canonical definition file for:
- All interfaces (`GameState`, `PlayerData`, `GameStateData`, `Office`, etc.)
- All enums (`Phase`, `StateSize`, `OfficeType`, `GameStatus`)
- All numeric constants (`POLL_COST`, `CAMPAIGN_COST`, `INITIAL_BUDGET`, etc.)
- Ideology presets (`IDEOLOGY_PRESETS` — 6 canonical parties: EPL, GEP, GSP, GDP, FRA, NOS; count matches `NUM_PARTIES` so every game uses all 6)
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

The electoral calendar (`src/game/calendar.ts`) maps each year to which office types hold elections, based on a 12-year cycle:

| Year | Elections |
|------|-----------|
| 0 | Deputies + Senators |
| 2 | Governors |
| 4 | Deputies |
| 6 | Governors + Senators |
| 8 | Deputies |
| 10 | Governors |
| 12 | Deputies + Senators |

Term lengths: Governors 4 years, Senators 6 years, Deputies 4 years. Governors are pre-assigned at game creation (mid-term: `electedYear: -2`, `expiresYear: 2`) so the first governor election falls at year 2. Senators and deputies start vacant and are first elected at year 0.
