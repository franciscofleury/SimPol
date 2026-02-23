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

## Information Access

State attributes (Expectation, Perceived Quality, Perceived Ideology) are hidden behind `?` placeholders until revealed. Knowledge is persisted in `game.players[0].knownInfo: KnownAttrInfo[]` — an array of per-attribute snapshots keyed by `(stateIndex, attributeIndex)`.

Two mechanisms write into `knownInfo`, both handled in the `END_PHASE` reducer case in `store.tsx`:

1. **Polling (snapshot)** — when the player executes a poll, the `PollResult` snapshot values (`expectation`, `perceivedQuality`, `perceivedIdeology`) are upserted into `knownInfo`. The value is frozen at poll time; if the underlying game state drifts in future rounds, the displayed value remains stale until re-polled.

2. **Governor privilege (live refresh)** — after each `playerReady()` / `advancePhase()` call completes (including perception drift), all 8 attributes for every state governed by the human party are upserted into `knownInfo` with current live values. Governor info always overwrites poll snapshots for the same attribute. `knownInfo` starts empty at game creation — the first governor refresh happens when the player ends the first phase.

**Dashboard.tsx** reads `knownInfo` and builds `Map<stateIndex, Map<attributeIndex, KnownAttrInfo>>`, passed to each `StateCard` as `knownAttributes`. **StateCard** reads display values from `knownAttributes.get(i)` (snapshot or live, depending on how it got into `knownInfo`) rather than from live `game.states`.

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

---

## Testing

Unit tests cover all pure TypeScript game-logic modules in `src/game/`. Tests use **Vitest** (native TypeScript support, Node environment, no browser needed). Config: `vitest.config.ts` in project root.

**Run tests:**
```bash
npm run test:run       # single run
npm run test           # watch mode
npm run test:coverage  # V8 coverage report
```

**Test file locations:** `src/game/__tests__/*.test.ts`

**Coverage scope:**

| Module | Test file | What's tested |
|---|---|---|
| `calendar.ts` | `calendar.test.ts` | All election years, non-election years, term-end helpers |
| `voters.ts` | `voters.test.ts` | Gap computation, GAP-weighted vote shares, floor, equal-weight fallback |
| `elections.ts` | `elections.test.ts` | D'Hondt seat allocation, plurality winner, full election runs (year 0, 2, 6, non-election) |
| `economy.ts` | `economy.test.ts` | canAfford, spendCoins, tier-based income distribution |
| `perception.ts` | `perception.test.ts` | perceivedQuality drift (deterministic, exact assertions), expectation noise (range assertions) |
| `scoring.ts` | `scoring.test.ts` | Reality ranking sort, Spearman correlation (incl. known ±1 cases), computeScores |
| `polls.ts` | `polls.test.ts` | roundToHalf, executePoll (validation, coin deduction, PollResult data), isGovernorOf |
| `campaigns.ts` | `campaigns.test.ts` | executeCampaign (validation, coin deduction, ideology boost) |
| `setup.ts` | `setup.test.ts` | createGame structural invariants, governor knowledge seeding into player.knownInfo |
| `engine.ts` | `engine.test.ts` | allPlayersReady, startGame, phase transitions (POLLS→CAMPAIGNS, CAMPAIGNS→next round), game-end |

**Excluded from tests:**
- `store.tsx` — React Context + useReducer; requires React test environment
- `ai.ts` — purely random decisions with no deterministic contract to assert
- `types.ts` — constants and type definitions only

**AI is mocked in `engine.test.ts`** via `vi.mock('../ai', () => ({ executeAITurn: vi.fn() }))` to prevent random AI behavior from polluting phase-transition assertions.

**Shared fixtures:** `src/game/__tests__/fixtures.ts` provides `createMinimalGameState()`, `makeState()`, `makePlayer()`, and `makeAttr()` — deterministic factory helpers used across all test files. Each test creates a fresh game state per `it()` block (no shared mutable state between tests).

**Knowledge assignment coverage:**
- **Governor seeding** (`createGame` in `setup.ts`) — verified that `player.knownInfo` is pre-populated with all 8 attributes for each governed state, with values matching `state.attributes[a].expectation`, `state.attributes[a].perceivedQuality`, and `state.perceivedIdeology[p][a]` for every party; AI players start with empty `knownInfo`
- **Poll data completeness** (`executePoll` in `polls.ts`) — verified that `PollResult.perceivedIdeology` captures all `NUM_PARTIES` entries, each matching the actual `state.perceivedIdeology[p][attributeIndex]`
- The downstream `upsertKnownAttr` writes (poll snapshots + governor live refresh) live in `store.tsx` and are outside the pure-logic test scope
