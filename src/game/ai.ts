import {
  GameState,
  NUM_ATTRIBUTES,
  COST_POLL,
  COST_CAMPAIGN,
} from './types';
import { executePoll } from './polls';
import { executeCampaign } from './campaigns';

/**
 * Simple/random AI decision-making.
 * AI takes random valid actions within budget during each phase.
 */
export function executeAITurn(game: GameState, playerIndex: number): void {
  const player = game.players[playerIndex];
  if (!player.isAI) return;

  const phase = game.currentPhase;

  if (phase === 'POLLS') {
    aiPolls(game, playerIndex);
  } else if (phase === 'CAMPAIGNS') {
    aiCampaigns(game, playerIndex);
  }
  // PROJECTS phase is not implemented yet

  // Mark AI as ready
  player.isReady = true;
}

function aiPolls(game: GameState, playerIndex: number): void {
  const player = game.players[playerIndex];

  // AI randomly decides to poll 0-2 states
  const numPolls = Math.floor(Math.random() * 3);
  for (let i = 0; i < numPolls; i++) {
    if (player.coins < COST_POLL) break;
    const stateIndex = Math.floor(Math.random() * game.states.length);
    executePoll(game, playerIndex, stateIndex);
  }
}

function aiCampaigns(game: GameState, playerIndex: number): void {
  const player = game.players[playerIndex];

  // AI randomly decides to campaign 0-2 times
  const numCampaigns = Math.floor(Math.random() * 3);
  for (let i = 0; i < numCampaigns; i++) {
    if (player.coins < COST_CAMPAIGN) break;
    const stateIndex = Math.floor(Math.random() * game.states.length);
    const attrIndex = Math.floor(Math.random() * NUM_ATTRIBUTES);
    executeCampaign(game, playerIndex, stateIndex, attrIndex);
  }
}
