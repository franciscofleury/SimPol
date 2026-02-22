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
}

export interface PollResult {
  round: number;
  stateIndex: number;
  expectation: number[];
  perceivedQuality: number[];
  perceivedIdeology: number[]; // this party's perceived ideology in that state
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
}

export interface CampaignAction {
  type: 'CAMPAIGN';
  playerIndex: number;
  stateIndex: number;
  attributeIndex: number;
}

export interface ReadyAction {
  type: 'READY';
  playerIndex: number;
}

export type GameAction = PollAction | CampaignAction | ReadyAction;

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
    name: 'Workers United',
    description: 'Prioritizes employment and health for the working class',
    color: '#DC2626', // red
    ideology: [0, 1, 6, 2, 3, 7, 5, 4], // Employment > Health > Infra > Education > Growth > Security > Environment > Fiscal
  },
  {
    name: 'Green Future',
    description: 'Environment and education are the path forward',
    color: '#16A34A', // green
    ideology: [5, 2, 1, 6, 0, 3, 4, 7], // Environment > Education > Health > Infra > Employment > Growth > Fiscal > Security
  },
  {
    name: 'Free Market Alliance',
    description: 'Economic growth and fiscal responsibility above all',
    color: '#2563EB', // blue
    ideology: [3, 4, 0, 6, 7, 2, 1, 5], // Growth > Fiscal > Employment > Infra > Security > Education > Health > Environment
  },
  {
    name: 'National Shield',
    description: 'Security and infrastructure protect the nation',
    color: '#7C3AED', // purple
    ideology: [7, 6, 0, 4, 3, 1, 2, 5], // Security > Infra > Employment > Fiscal > Growth > Health > Education > Environment
  },
  {
    name: 'Social Progress',
    description: 'Health and education create a just society',
    color: '#F59E0B', // amber
    ideology: [1, 2, 5, 0, 6, 3, 7, 4], // Health > Education > Environment > Employment > Infra > Growth > Security > Fiscal
  },
  {
    name: 'Development First',
    description: 'Infrastructure and growth drive prosperity',
    color: '#0891B2', // cyan
    ideology: [6, 3, 0, 4, 1, 7, 2, 5], // Infra > Growth > Employment > Fiscal > Health > Security > Education > Environment
  },
  {
    name: 'Civic Order',
    description: 'Balanced approach with security and fiscal discipline',
    color: '#64748B', // slate
    ideology: [4, 7, 3, 6, 0, 1, 2, 5], // Fiscal > Security > Growth > Infra > Employment > Health > Education > Environment
  },
  {
    name: 'People\'s Coalition',
    description: 'Employment and education empower the people',
    color: '#EA580C', // orange
    ideology: [0, 2, 1, 5, 6, 3, 7, 4], // Employment > Education > Health > Environment > Infra > Growth > Security > Fiscal
  },
];

export const PARTY_COLORS = [
  '#DC2626', '#2563EB', '#16A34A', '#F59E0B', '#7C3AED', '#0891B2',
];
