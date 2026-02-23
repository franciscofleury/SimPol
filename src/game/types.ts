// ============================================================
// SimPol Game Types & Constants
// ============================================================

export const ATTRIBUTES = [
  'employment',
  'health',
  'education',
  'growth',
  'fiscalAusterity',
  'environment',
  'infrastructure',
  'security',
] as const;

export type Attribute = (typeof ATTRIBUTES)[number];

export const ATTRIBUTE_LABELS: Record<Attribute, string> = {
  employment: 'Employment',
  health: 'Health',
  education: 'Education',
  growth: 'Growth',
  fiscalAusterity: 'Fiscal Austerity',
  environment: 'Environment',
  infrastructure: 'Infrastructure',
  security: 'Security',
};

export const NUM_ATTRIBUTES = 8;
export const NUM_PARTIES = 6;
export const NUM_STATES = 6;
export const SENATORS_PER_STATE = 2;
export const TOTAL_SENATORS = NUM_STATES * SENATORS_PER_STATE;

// Rank position (1-8) to star value
export const RANK_TO_STARS: Record<number, number> = {
  1: 4.0,
  2: 3.5,
  3: 3.0,
  4: 2.5,
  5: 2.0,
  6: 1.5,
  7: 1.0,
  8: 0.5,
};

// Costs
export const COST_POLL = 10;
export const COST_CAMPAIGN = 25;
export const INITIAL_BUDGET = 100;

// After first deputy election, annual income by deputy count ranking
// Top 2 parties: 120, middle 2: 100, bottom 2: 80
export const DEPUTY_FUNDING_TIERS = [120, 120, 100, 100, 80, 80] as const;

// State sizes
export type StateSize = 'SMALL' | 'MEDIUM' | 'LARGE';

export interface StateSizeConfig {
  size: StateSize;
  deputies: number;
  initialTotalStars: number;
}

// 3 Small (poor), 2 Medium, 1 Large (rich)
export const STATE_CONFIGS: StateSizeConfig[] = [
  { size: 'SMALL', deputies: 30, initialTotalStars: 20.0 },
  { size: 'SMALL', deputies: 30, initialTotalStars: 20.0 },
  { size: 'SMALL', deputies: 30, initialTotalStars: 20.0 },
  { size: 'MEDIUM', deputies: 40, initialTotalStars: 25.0 },
  { size: 'MEDIUM', deputies: 40, initialTotalStars: 25.0 },
  { size: 'LARGE', deputies: 50, initialTotalStars: 30.0 },
];

export const TOTAL_DEPUTIES = STATE_CONFIGS.reduce((sum, s) => sum + s.deputies, 0); // 220

export const STATE_NAMES = [
  'Northfield',
  'Eastport',
  'Southvale',
  'Westholm',
  'Centria',
  'Grandridge',
];

// Ideology: a permutation of attribute indices [0..7] representing priority order
// ideology[0] = index of rank-1 attribute, ideology[7] = index of rank-8 attribute
export type Ideology = [number, number, number, number, number, number, number, number];

// Game phases within a round
export type Phase = 'POLLS' | 'CAMPAIGNS' | 'PROJECTS' | 'ELECTIONS' | 'ROUND_END';

export type GameStatus = 'SETUP' | 'IN_PROGRESS' | 'FINISHED';

// ============================================================
// State Attribute Data
// ============================================================

export interface StateAttributeData {
  realQuality: number;
  perceivedQuality: number;
  expectation: number;
}

// ============================================================
// Office types
// ============================================================

export type OfficeType = 'GOVERNOR' | 'SENATOR_1' | 'SENATOR_2';

export interface Office {
  type: OfficeType;
  partyIndex: number | null; // null if vacant
  electedYear: number | null;
  expiresYear: number | null;
}

// ============================================================
// Core Game State
// ============================================================

export interface GameStateData {
  name: string;
  stateIndex: number;
  size: StateSize;
  deputies: number;
  attributes: StateAttributeData[]; // length 8
  // perceivedIdeology[partyIndex][attributeIndex] = how voters in this state
  // perceive party's commitment to this attribute
  perceivedIdeology: number[][]; // [NUM_PARTIES][NUM_ATTRIBUTES]
  offices: Office[];
  // deputyAllocation[partyIndex] = number of deputies held
  deputyAllocation: Record<number, number>;
}

export interface PlayerData {
  partyIndex: number;
  name: string;
  color: string;
  isAI: boolean;
  isHuman: boolean;
  coins: number;
  ideology: Ideology;
  isReady: boolean;
  // Track poll results the player has purchased (private info)
  pollResults: PollResult[];
  campaignResults: CampaignResult[];
}

export interface PollResult {
  round: number;
  stateIndex: number;
  attributeIndex: number;      // which attribute was polled
  expectation: number;         // single value for the polled attribute
  perceivedQuality: number;    // single value for the polled attribute
  perceivedIdeology: number[]; // all parties' perception for this attr (indexed by partyIndex)
}

export interface CampaignResult {
  round: number;
  stateIndex: number;
  attributeIndex: number;
}

export interface ElectionResult {
  year: number;
  types: ElectionType[];
  deputyResults?: Record<number, Record<number, number>>; // stateIndex -> partyIndex -> seats
  governorResults?: Record<number, number>; // stateIndex -> winning partyIndex
  senatorResults?: Record<number, number[]>; // stateIndex -> [winner1, winner2] partyIndices
}

export type ElectionType = 'DEPUTIES' | 'GOVERNORS' | 'SENATORS';

export interface RoundData {
  number: number;
  electionResult?: ElectionResult;
}

export interface GameState {
  status: GameStatus;
  currentRound: number;
  currentPhase: Phase;
  maxRounds: number; // configurable game length
  states: GameStateData[];
  players: PlayerData[];
  rounds: RoundData[];
  // Has the first deputy election occurred? (determines income model)
  firstDeputyElectionDone: boolean;
}

// ============================================================
// Actions
// ============================================================

export interface PollAction {
  type: 'POLL';
  playerIndex: number;
  stateIndex: number;
  attributeIndex: number;
}

export interface ReadyAction {
  type: 'READY';
  playerIndex: number;
}

export type GameAction = PollAction | ReadyAction;

// ============================================================
// Preset Ideologies
// ============================================================

export interface IdeologyPreset {
  name: string;
  description: string;
  color: string;
  ideology: Ideology;
}

// Attribute index reference:
// 0=Employment, 1=Health, 2=Education, 3=Growth,
// 4=FiscalAusterity, 5=Environment, 6=Infrastructure, 7=Security
export const IDEOLOGY_PRESETS: IdeologyPreset[] = [
  {
    name: 'EPL — Employment & Public Life Party',
    description: 'Social-development oriented, prioritizes labor markets and public welfare systems.',
    color: '#DC2626', // red
    ideology: [0, 1, 2, 3, 4, 5, 6, 7], // Employment > Health > Education > Growth > Fiscal > Environment > Infrastructure > Security
  },
  {
    name: 'GEP — Green Education Party',
    description: 'Knowledge-driven and environmentally focused, advocates long-term public investment.',
    color: '#16A34A', // green
    ideology: [2, 5, 6, 0, 1, 4, 7, 3], // Education > Environment > Infrastructure > Employment > Health > Fiscal > Security > Growth
  },
  {
    name: 'GSP — Green Security Party',
    description: 'Eco-pragmatic with emphasis on public order and health systems.',
    color: '#0D9488', // teal
    ideology: [5, 7, 1, 4, 3, 2, 0, 6], // Environment > Security > Health > Fiscal > Growth > Education > Employment > Infrastructure
  },
  {
    name: 'GDP — Growth & Development Party',
    description: 'Expansionist and productivity-oriented, centered on economic strength.',
    color: '#2563EB', // blue
    ideology: [3, 0, 7, 1, 5, 6, 4, 2], // Growth > Employment > Security > Health > Environment > Infrastructure > Fiscal > Education
  },
  {
    name: 'FRA — Fiscal Responsibility Alliance',
    description: 'Economically conservative, prioritizes fiscal balance and efficiency.',
    color: '#D97706', // amber
    ideology: [4, 3, 5, 6, 7, 1, 2, 0], // Fiscal > Growth > Environment > Infrastructure > Security > Health > Education > Employment
  },
  {
    name: 'NOS — National Order & Security Party',
    description: 'Stability-oriented, emphasizes security and state authority.',
    color: '#475569', // slate
    ideology: [7, 6, 4, 2, 0, 3, 1, 5], // Security > Infrastructure > Fiscal > Education > Employment > Growth > Health > Environment
  },
];

