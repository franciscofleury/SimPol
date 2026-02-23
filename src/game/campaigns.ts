import { GameState, CampaignResult, COST_CAMPAIGN, NUM_ATTRIBUTES } from './types';
import { canAfford, spendCoins } from './economy';

// How much a campaign increases perceived ideological value
const CAMPAIGN_BOOST = 0.5;

/**
 * Execute a campaign action: increase the party's Perceived Ideological Value
 * for a specific attribute in a specific state.
 *
 * Returns CampaignResult on success, null if invalid or insufficient funds.
 */
export function executeCampaign(
  game: GameState,
  playerIndex: number,
  stateIndex: number,
  attributeIndex: number,
): CampaignResult | null {
  if (!canAfford(game, playerIndex, COST_CAMPAIGN)) return null;
  if (stateIndex < 0 || stateIndex >= game.states.length) return null;
  if (attributeIndex < 0 || attributeIndex >= NUM_ATTRIBUTES) return null;

  spendCoins(game, playerIndex, COST_CAMPAIGN);

  const state = game.states[stateIndex];
  state.perceivedIdeology[playerIndex][attributeIndex] += CAMPAIGN_BOOST;

  const result: CampaignResult = {
    round: game.currentRound,
    stateIndex,
    attributeIndex,
  };
  game.players[playerIndex].campaignResults.push(result);
  return result;
}
