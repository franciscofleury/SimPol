import { GameState, DEPUTY_FUNDING_TIERS, NUM_PARTIES } from './types';
import { getTotalDeputies } from './elections';

/**
 * Distribute annual income to all parties based on deputy count ranking.
 * Top 2 parties get 120, middle 2 get 100, bottom 2 get 80.
 * Only applies after the first deputy election.
 */
export function distributeAnnualIncome(game: GameState): void {
  if (!game.firstDeputyElectionDone) return;

  const totalDeputies = getTotalDeputies(game);

  // Sort parties by deputy count (descending), break ties by party index
  const ranked = Object.entries(totalDeputies)
    .map(([p, count]) => ({ partyIndex: Number(p), count }))
    .sort((a, b) => b.count - a.count || a.partyIndex - b.partyIndex);

  for (let i = 0; i < ranked.length; i++) {
    const funding = DEPUTY_FUNDING_TIERS[i];
    const player = game.players[ranked[i].partyIndex];
    player.coins += funding;
  }
}

/**
 * Check if a player can afford an action.
 */
export function canAfford(game: GameState, playerIndex: number, cost: number): boolean {
  return game.players[playerIndex].coins >= cost;
}

/**
 * Deduct coins from a player.
 */
export function spendCoins(game: GameState, playerIndex: number, amount: number): void {
  game.players[playerIndex].coins -= amount;
}
