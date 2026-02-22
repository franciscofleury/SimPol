import { GameState, COST_CAMPAIGN, NUM_ATTRIBUTES } from './types';
import { canAfford, spendCoins } from './economy';

// How much a campaign increases perceived ideological value
const CAMPAIGN_BOOST = 0.5;

/**
 * Execute a campaign action: increase the party's Perceived Ideological Value
 * for a specific attribute in a specific state.
 *
 * Returns true if successful, false if invalid.
 */
export function executeCampaign(
  game: GameState,
  playerIndex: number,
  stateIndex: number,
  attributeIndex: number,
): boolean {
  if (!canAfford(game, playerIndex, COST_CAMPAIGN)) return false;
  if (stateIndex < 0 || stateIndex >= game.states.length) return false;
  if (attributeIndex < 0 || attributeIndex >= NUM_ATTRIBUTES) return false;

  spendCoins(game, playerIndex, COST_CAMPAIGN);

  const state = game.states[stateIndex];
  state.perceivedIdeology[playerIndex][attributeIndex] += CAMPAIGN_BOOST;

  return true;
}
