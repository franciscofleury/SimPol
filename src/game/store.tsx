'use client';

import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import {
  GameState,
  GameAction,
  PollResult,
  CampaignResult,
  ElectionResult,
  KnownAttrInfo,
  COST_POLL,
  COST_CAMPAIGN,
  NUM_ATTRIBUTES,
} from './types';
import { createGame } from './setup';
import { executePoll } from './polls';
import { executeCampaign } from './campaigns';
import { playerReady, executeAllAITurns, startGame } from './engine';

// ============================================================
// Results log entry (unified poll + campaign)
// ============================================================

export type ResultLogEntry =
  | { id: string; kind: 'poll'; data: PollResult }
  | { id: string; kind: 'campaign'; data: CampaignResult }
  | { id: string; kind: 'election'; data: ElectionResult };

// ============================================================
// Actions for the reducer
// ============================================================

type StoreAction =
  | { type: 'NEW_GAME'; presetIndex: number; maxRounds: number }
  | { type: 'START_GAME' }
  | { type: 'SCHEDULE_POLL'; stateIndex: number; attributeIndex: number }
  | { type: 'CANCEL_POLL'; stateIndex: number; attributeIndex: number }
  | { type: 'SCHEDULE_CAMPAIGN'; stateIndex: number; attributeIndex: number }
  | { type: 'CANCEL_CAMPAIGN'; stateIndex: number; attributeIndex: number }
  | { type: 'DELETE_RESULT_LOG_ENTRY'; id: string }
  | { type: 'CLEAR_RESULTS_LOG' }
  | { type: 'END_PHASE' }
  | { type: 'SET_MESSAGE'; message: string };

interface StoreState {
  game: GameState | null;
  message: string;
  scheduledPolls: Array<{ stateIndex: number; attributeIndex: number }>;
  scheduledCampaigns: Array<{ stateIndex: number; attributeIndex: number }>;
  resultsLog: ResultLogEntry[];
}

const HUMAN_PLAYER_INDEX = 0;

function upsertKnownAttr(knownInfo: KnownAttrInfo[], entry: KnownAttrInfo): void {
  const idx = knownInfo.findIndex(
    (k) => k.stateIndex === entry.stateIndex && k.attributeIndex === entry.attributeIndex,
  );
  if (idx >= 0) knownInfo[idx] = entry;
  else knownInfo.push(entry);
}

function gameReducer(state: StoreState, action: StoreAction): StoreState {
  switch (action.type) {
    case 'NEW_GAME': {
      const game = createGame(action.presetIndex, action.maxRounds);
      return { ...state, game, message: 'Game created. Ready to start!' };
    }

    case 'START_GAME': {
      if (!state.game) return state;
      const game = structuredClone(state.game);
      const msg = startGame(game);
      return { ...state, game, message: msg };
    }

    case 'SCHEDULE_POLL': {
      if (!state.game) return state;
      const { stateIndex, attributeIndex } = action;
      const humanPlayer = state.game.players[HUMAN_PLAYER_INDEX];

      // Validate affordability: existing queue + this new poll
      const totalCost = COST_POLL * (state.scheduledPolls.length + 1);
      if (humanPlayer.coins < totalCost) {
        return { ...state, message: 'Insufficient funds to schedule this poll.' };
      }

      // Block duplicate in queue
      const alreadyQueued = state.scheduledPolls.some(
        (p) => p.stateIndex === stateIndex && p.attributeIndex === attributeIndex,
      );
      if (alreadyQueued) return state;

      // Block already polled this round
      const currentRound = state.game.currentRound;
      const alreadyPolled = humanPlayer.pollResults.some(
        (r) => r.stateIndex === stateIndex && r.attributeIndex === attributeIndex && r.round === currentRound,
      );
      if (alreadyPolled) return state;

      return {
        ...state,
        scheduledPolls: [...state.scheduledPolls, { stateIndex, attributeIndex }],
        message: `Poll scheduled for ${state.game.states[stateIndex].name}.`,
      };
    }

    case 'CANCEL_POLL': {
      return {
        ...state,
        scheduledPolls: state.scheduledPolls.filter(
          (p) => !(p.stateIndex === action.stateIndex && p.attributeIndex === action.attributeIndex),
        ),
        message: 'Scheduled poll cancelled.',
      };
    }

    case 'SCHEDULE_CAMPAIGN': {
      if (!state.game) return state;
      const { stateIndex, attributeIndex } = action;
      const humanPlayer = state.game.players[HUMAN_PLAYER_INDEX];

      // Affordability: total cost of queue + this new campaign
      const totalCost = COST_CAMPAIGN * (state.scheduledCampaigns.length + 1);
      if (humanPlayer.coins < totalCost) {
        return { ...state, message: 'Insufficient funds to schedule this campaign.' };
      }

      // Block duplicate in queue
      const alreadyQueued = state.scheduledCampaigns.some(
        (c) => c.stateIndex === stateIndex && c.attributeIndex === attributeIndex,
      );
      if (alreadyQueued) return state;

      // Block same-round re-campaign
      const currentRound = state.game.currentRound;
      const alreadyCampaigned = humanPlayer.campaignResults.some(
        (r) => r.stateIndex === stateIndex && r.attributeIndex === attributeIndex && r.round === currentRound,
      );
      if (alreadyCampaigned) return state;

      return {
        ...state,
        scheduledCampaigns: [...state.scheduledCampaigns, { stateIndex, attributeIndex }],
        message: `Campaign scheduled in ${state.game.states[stateIndex].name}.`,
      };
    }

    case 'CANCEL_CAMPAIGN': {
      return {
        ...state,
        scheduledCampaigns: state.scheduledCampaigns.filter(
          (c) => !(c.stateIndex === action.stateIndex && c.attributeIndex === action.attributeIndex),
        ),
        message: 'Scheduled campaign cancelled.',
      };
    }

    case 'DELETE_RESULT_LOG_ENTRY': {
      return {
        ...state,
        resultsLog: state.resultsLog.filter((e) => e.id !== action.id),
      };
    }

    case 'CLEAR_RESULTS_LOG': {
      return { ...state, resultsLog: [] };
    }

    case 'END_PHASE': {
      if (!state.game) return state;
      const game = structuredClone(state.game);

      let resultsLog = state.resultsLog;
      let scheduledPolls = state.scheduledPolls;

      if (game.currentPhase === 'POLLS' && scheduledPolls.length > 0) {
        const results: PollResult[] = [];
        for (const p of scheduledPolls) {
          const result = executePoll(game, HUMAN_PLAYER_INDEX, p.stateIndex, p.attributeIndex);
          if (result) results.push(result);
        }
        const newEntries: ResultLogEntry[] = results.map((r) => ({
          id: `poll-r${r.round}-s${r.stateIndex}-a${r.attributeIndex}`,
          kind: 'poll',
          data: r,
        }));
        resultsLog = [...resultsLog, ...newEntries];
        scheduledPolls = [];

        // Persist poll snapshots into knownInfo
        for (const result of results) {
          upsertKnownAttr(game.players[HUMAN_PLAYER_INDEX].knownInfo, {
            stateIndex: result.stateIndex,
            attributeIndex: result.attributeIndex,
            expectation: result.expectation,
            perceivedQuality: result.perceivedQuality,
            perceivedIdeology: result.perceivedIdeology,
          });
        }
      }

      let scheduledCampaigns = state.scheduledCampaigns;

      if (game.currentPhase === 'CAMPAIGNS' && scheduledCampaigns.length > 0) {
        const results: CampaignResult[] = [];
        for (const c of scheduledCampaigns) {
          const result = executeCampaign(game, HUMAN_PLAYER_INDEX, c.stateIndex, c.attributeIndex);
          if (result) results.push(result);
        }
        const newEntries: ResultLogEntry[] = results.map((r) => ({
          id: `campaign-r${r.round}-s${r.stateIndex}-a${r.attributeIndex}`,
          kind: 'campaign',
          data: r,
        }));
        resultsLog = [...resultsLog, ...newEntries];
        scheduledCampaigns = [];
      }

      const roundBeforeAdvance = game.currentRound;
      const phaseBeforeAdvance = game.currentPhase;
      executeAllAITurns(game);
      const msg = playerReady(game, HUMAN_PLAYER_INDEX);

      // Governor live refresh: after phase advance (drift applied), overwrite knownInfo
      // for all governed states with current live values
      const humanPartyIndex = game.players[HUMAN_PLAYER_INDEX].partyIndex;
      for (const state of game.states) {
        const governor = state.offices.find((o) => o.type === 'GOVERNOR');
        if (governor?.partyIndex === humanPartyIndex) {
          for (let a = 0; a < NUM_ATTRIBUTES; a++) {
            upsertKnownAttr(game.players[HUMAN_PLAYER_INDEX].knownInfo, {
              stateIndex: state.stateIndex,
              attributeIndex: a,
              expectation: state.attributes[a].expectation,
              perceivedQuality: state.attributes[a].perceivedQuality,
              perceivedIdeology: state.perceivedIdeology.map((row) => row[a]),
            });
          }
        }
      }

      // Append election result to log if elections ran during this phase transition
      if (phaseBeforeAdvance === 'CAMPAIGNS') {
        const electionResult = game.rounds.find(
          (r) => r.number === roundBeforeAdvance,
        )?.electionResult;
        if (electionResult) {
          resultsLog = [
            ...resultsLog,
            { id: `election-r${roundBeforeAdvance}`, kind: 'election', data: electionResult },
          ];
        }
      }

      return { ...state, game, message: msg, resultsLog, scheduledPolls, scheduledCampaigns };
    }

    case 'SET_MESSAGE': {
      return { ...state, message: action.message };
    }

    default:
      return state;
  }
}

// ============================================================
// Context
// ============================================================

const initialState: StoreState = {
  game: null,
  message: '',
  scheduledPolls: [],
  scheduledCampaigns: [],
  resultsLog: [],
};

const GameContext = createContext<StoreState>(initialState);
const GameDispatchContext = createContext<Dispatch<StoreAction>>(() => {});

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  return (
    <GameContext.Provider value={state}>
      <GameDispatchContext.Provider value={dispatch}>
        {children}
      </GameDispatchContext.Provider>
    </GameContext.Provider>
  );
}

export function useGameState() {
  return useContext(GameContext);
}

export function useGameDispatch() {
  return useContext(GameDispatchContext);
}
