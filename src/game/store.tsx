'use client';

import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import {
  GameState,
  GameAction,
  PollResult,
  COST_POLL,
} from './types';
import { createGame } from './setup';
import { executePoll } from './polls';
import { executeCampaign } from './campaigns';
import { playerReady, executeAllAITurns, startGame } from './engine';

// ============================================================
// Actions for the reducer
// ============================================================

type StoreAction =
  | { type: 'NEW_GAME'; presetIndex: number; maxRounds: number }
  | { type: 'START_GAME' }
  | { type: 'SCHEDULE_POLL'; stateIndex: number; attributeIndex: number }
  | { type: 'CANCEL_POLL'; stateIndex: number; attributeIndex: number }
  | { type: 'DISMISS_POLL_RESULTS' }
  | { type: 'CAMPAIGN'; stateIndex: number; attributeIndex: number }
  | { type: 'END_PHASE' }
  | { type: 'SET_MESSAGE'; message: string };

interface StoreState {
  game: GameState | null;
  message: string;
  scheduledPolls: Array<{ stateIndex: number; attributeIndex: number }>;
  lastPollResults: PollResult[];
}

const HUMAN_PLAYER_INDEX = 0;

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

    case 'DISMISS_POLL_RESULTS': {
      return { ...state, lastPollResults: [] };
    }

    case 'CAMPAIGN': {
      if (!state.game) return state;
      const game = structuredClone(state.game);
      const success = executeCampaign(
        game,
        HUMAN_PLAYER_INDEX,
        action.stateIndex,
        action.attributeIndex,
      );
      if (!success) {
        return { ...state, message: 'Cannot execute campaign (insufficient funds or invalid selection).' };
      }
      return {
        ...state,
        game,
        message: `Campaign launched in ${game.states[action.stateIndex].name}.`,
      };
    }

    case 'END_PHASE': {
      if (!state.game) return state;
      const game = structuredClone(state.game);

      let lastPollResults = state.lastPollResults;
      let scheduledPolls = state.scheduledPolls;

      if (game.currentPhase === 'POLLS' && scheduledPolls.length > 0) {
        const results: PollResult[] = [];
        for (const p of scheduledPolls) {
          const result = executePoll(game, HUMAN_PLAYER_INDEX, p.stateIndex, p.attributeIndex);
          if (result) results.push(result);
        }
        lastPollResults = results;
        scheduledPolls = [];
      }

      executeAllAITurns(game);
      const msg = playerReady(game, HUMAN_PLAYER_INDEX);

      return { ...state, game, message: msg, lastPollResults, scheduledPolls };
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
  lastPollResults: [],
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
