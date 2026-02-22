import {
  GameState,
  GameStateData,
  PlayerData,
  StateAttributeData,
  Office,
  IdeologyPreset,
  IDEOLOGY_PRESETS,
  STATE_CONFIGS,
  STATE_NAMES,
  NUM_ATTRIBUTES,
  NUM_PARTIES,
  INITIAL_BUDGET,
  RANK_TO_STARS,
  PARTY_COLORS,
} from './types';

/**
 * Distribute a total number of stars across N attributes randomly.
 * Values are rounded to 0.5 increments.
 */
function distributeStars(totalStars: number, count: number): number[] {
  const weights = Array.from({ length: count }, () => Math.random() + 0.1);
  const sum = weights.reduce((a, b) => a + b, 0);
  const values = weights.map((w) => Math.round((w / sum) * totalStars * 2) / 2);

  // Adjust to ensure exact total
  const currentSum = values.reduce((a, b) => a + b, 0);
  const diff = Math.round((totalStars - currentSum) * 2) / 2;
  values[0] += diff;

  // Ensure no negative values
  return values.map((v) => Math.max(0.5, v));
}

/**
 * Create initial state data for all 6 states.
 */
function createStates(): GameStateData[] {
  return STATE_CONFIGS.map((config, index) => {
    const realQualities = distributeStars(config.initialTotalStars, NUM_ATTRIBUTES);

    const attributes: StateAttributeData[] = realQualities.map((rq) => ({
      realQuality: rq,
      // Initially, perception matches reality
      perceivedQuality: rq,
      // Expectation is slightly above reality (voters always want more)
      expectation: rq + 0.5 + Math.random() * 1.0,
    }));

    // Initialize perceived ideology for all parties (will be set after parties are created)
    const perceivedIdeology: number[][] = Array.from({ length: NUM_PARTIES }, () =>
      Array(NUM_ATTRIBUTES).fill(0),
    );

    const offices: Office[] = [
      {
        type: 'GOVERNOR',
        partyIndex: null,
        electedYear: null,
        expiresYear: null,
      },
      {
        type: 'SENATOR_1',
        partyIndex: null,
        electedYear: null,
        expiresYear: null,
      },
      {
        type: 'SENATOR_2',
        partyIndex: null,
        electedYear: null,
        expiresYear: null,
      },
    ];

    const deputyAllocation: Record<number, number> = {};
    for (let p = 0; p < NUM_PARTIES; p++) {
      deputyAllocation[p] = 0;
    }

    return {
      name: STATE_NAMES[index],
      stateIndex: index,
      size: config.size,
      deputies: config.deputies,
      attributes,
      perceivedIdeology,
      offices,
      deputyAllocation,
    };
  });
}

/**
 * Convert an ideology ranking to star values per attribute.
 * ideology[0] = rank 1 attribute index -> gets 4.0 stars
 */
function ideologyToStarValues(ideology: number[]): number[] {
  const values = Array(NUM_ATTRIBUTES).fill(0);
  ideology.forEach((attrIndex, rankIndex) => {
    values[attrIndex] = RANK_TO_STARS[rankIndex + 1];
  });
  return values;
}

/**
 * Create player data from selected presets.
 * humanPresetIndex: the preset the human player chose (null for AI-only games)
 * humanPlayerIndex: which party slot (0-5) the human occupies
 */
function createPlayers(
  humanPresetIndex: number | null,
  humanPlayerIndex: number = 0,
): PlayerData[] {
  // Collect available presets (excluding the human's choice)
  const availablePresets = IDEOLOGY_PRESETS.filter(
    (_, i) => i !== humanPresetIndex,
  );

  // Shuffle available presets for AI assignment
  const shuffled = [...availablePresets].sort(() => Math.random() - 0.5);

  const players: PlayerData[] = [];
  let aiPresetIdx = 0;

  for (let i = 0; i < NUM_PARTIES; i++) {
    const isHuman = i === humanPlayerIndex && humanPresetIndex !== null;
    const preset = isHuman
      ? IDEOLOGY_PRESETS[humanPresetIndex!]
      : shuffled[aiPresetIdx++];

    players.push({
      partyIndex: i,
      name: preset.name,
      color: PARTY_COLORS[i],
      isAI: !isHuman,
      isHuman,
      coins: INITIAL_BUDGET,
      ideology: [...preset.ideology] as PlayerData['ideology'],
      isReady: false,
      pollResults: [],
    });
  }

  return players;
}

/**
 * Initialize perceived ideology in all states based on actual party ideologies.
 * Initially, voters perceive ideology accurately.
 */
function initializePerceivedIdeology(
  states: GameStateData[],
  players: PlayerData[],
): void {
  for (const state of states) {
    for (const player of players) {
      const starValues = ideologyToStarValues(player.ideology as number[]);
      state.perceivedIdeology[player.partyIndex] = starValues;
    }
  }
}

/**
 * Set up initial governors (they're already in office with 2 years remaining at year 0).
 * Assign randomly since no election has happened yet.
 */
function initializeGovernors(states: GameStateData[]): void {
  const partyIndices = Array.from({ length: NUM_PARTIES }, (_, i) => i);
  const shuffled = [...partyIndices].sort(() => Math.random() - 0.5);

  states.forEach((state, i) => {
    const govOffice = state.offices.find((o) => o.type === 'GOVERNOR');
    if (govOffice) {
      govOffice.partyIndex = shuffled[i % NUM_PARTIES];
      govOffice.electedYear = -2; // elected 2 years before game start
      govOffice.expiresYear = 2; // expires at year 2
    }
  });
}

/**
 * Create a new game with full initial state.
 */
export function createGame(
  humanPresetIndex: number,
  maxRounds: number = 12,
): GameState {
  const states = createStates();
  const players = createPlayers(humanPresetIndex, 0);

  initializePerceivedIdeology(states, players);
  initializeGovernors(states);

  return {
    status: 'IN_PROGRESS',
    currentRound: 0,
    currentPhase: 'POLLS',
    maxRounds,
    states,
    players,
    rounds: [],
    firstDeputyElectionDone: false,
  };
}
