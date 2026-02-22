'use client';

import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import {
  GameState,
  GameAction,
  PollResult,
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
  | { type: 'POLL'; stateIndex: number }
  | { type: 'CAMPAIGN'; stateIndex: number; attributeIndex: number }
  | { type: 'END_PHASE' } // human player marks ready, triggers AI + phase advance
  | { type: 'SET_MESSAGE'; message: string };

interface StoreState {
  game: GameState | null;
  message: string;
  lastPollResult: PollResult | null;
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

    case 'POLL': {
      if (!state.game) return state;
      const game = structuredClone(state.game);
      const result = executePoll(game, HUMAN_PLAYER_INDEX, action.stateIndex);
      if (!result) {
        return { ...state, message: 'Cannot execute poll (insufficient funds or invalid state).' };
      }
      return {
        ...state,
        game,
        lastPollResult: result,
        message: `Poll completed for ${game.states[action.stateIndex].name}.`,
      };
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

      // Execute AI turns first
      executeAllAITurns(game);

      // Mark human player as ready
      const msg = playerReady(game, HUMAN_PLAYER_INDEX);

      return { ...state, game, message: msg, lastPollResult: null };
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
  lastPollResult: null,
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
