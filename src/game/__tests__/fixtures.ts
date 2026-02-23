import type {
  GameState,
  GameStateData,
  PlayerData,
  StateAttributeData,
  Office,
} from '../types';
import {
  NUM_ATTRIBUTES,
  NUM_PARTIES,
  NUM_STATES,
  INITIAL_BUDGET,
} from '../types';

/** Build a single StateAttributeData with explicit values. */
export function makeAttr(
  realQuality = 3,
  perceivedQuality = 2,
  expectation = 3.5,
): StateAttributeData {
  return { realQuality, perceivedQuality, expectation };
}

/** Build a single GameStateData with all attributes at default values. */
export function makeState(
  stateIndex: number,
  overrides: Partial<GameStateData> = {},
): GameStateData {
  const attributes: StateAttributeData[] = Array.from(
    { length: NUM_ATTRIBUTES },
    () => makeAttr(),
  );

  const perceivedIdeology: number[][] = Array.from(
    { length: NUM_PARTIES },
    () => Array(NUM_ATTRIBUTES).fill(2.0),
  );

  const offices: Office[] = [
    { type: 'GOVERNOR', partyIndex: null, electedYear: null, expiresYear: null },
    { type: 'SENATOR_1', partyIndex: null, electedYear: null, expiresYear: null },
    { type: 'SENATOR_2', partyIndex: null, electedYear: null, expiresYear: null },
  ];

  const deputyAllocation: Record<number, number> = {};
  for (let p = 0; p < NUM_PARTIES; p++) deputyAllocation[p] = 0;

  return {
    name: `State${stateIndex}`,
    stateIndex,
    size: 'MEDIUM',
    deputies: 40,
    attributes,
    perceivedIdeology,
    offices,
    deputyAllocation,
    ...overrides,
  };
}

/** Build a single PlayerData. */
export function makePlayer(
  partyIndex: number,
  overrides: Partial<PlayerData> = {},
): PlayerData {
  return {
    partyIndex,
    name: `Party${partyIndex}`,
    color: '#000000',
    isAI: partyIndex !== 0,
    isHuman: partyIndex === 0,
    coins: INITIAL_BUDGET,
    ideology: [0, 1, 2, 3, 4, 5, 6, 7],
    isReady: false,
    pollResults: [],
    campaignResults: [],
    knownInfo: [],
    ...overrides,
  };
}

/** Create a minimal but fully valid GameState with no randomness. */
export function createMinimalGameState(
  overrides: Partial<GameState> = {},
): GameState {
  const states: GameStateData[] = Array.from({ length: NUM_STATES }, (_, i) =>
    makeState(i),
  );
  const players: PlayerData[] = Array.from({ length: NUM_PARTIES }, (_, i) =>
    makePlayer(i),
  );

  return {
    status: 'IN_PROGRESS',
    currentRound: 0,
    currentPhase: 'POLLS',
    maxRounds: 12,
    states,
    players,
    rounds: [],
    firstDeputyElectionDone: false,
    ...overrides,
  };
}
