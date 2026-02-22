import { GameState, NUM_ATTRIBUTES, NUM_PARTIES, ATTRIBUTES, Ideology } from './types';

/**
 * Compute the country's reality ranking: sort 8 attributes by their
 * average Real Quality across all states (descending).
 * Returns attribute indices in order from highest to lowest avg quality.
 */
export function computeRealityRanking(game: GameState): number[] {
  const averages: { attrIndex: number; avg: number }[] = [];

  for (let a = 0; a < NUM_ATTRIBUTES; a++) {
    let total = 0;
    for (const state of game.states) {
      total += state.attributes[a].realQuality;
    }
    averages.push({ attrIndex: a, avg: total / game.states.length });
  }

  // Sort descending by average (highest quality = rank 1)
  averages.sort((a, b) => b.avg - a.avg);

  return averages.map((a) => a.attrIndex);
}

/**
 * Compute Spearman's rank correlation coefficient between two rankings.
 * Both inputs are arrays of attribute indices in priority order.
 * Returns a value between -1 (perfectly inverted) and 1 (identical).
 */
export function spearmanCorrelation(ranking1: number[], ranking2: number[]): number {
  const n = ranking1.length;

  // Convert to rank maps: attrIndex -> rank position (1-based)
  const rank1: Record<number, number> = {};
  const rank2: Record<number, number> = {};
  ranking1.forEach((attr, i) => (rank1[attr] = i + 1));
  ranking2.forEach((attr, i) => (rank2[attr] = i + 1));

  // Sum of squared rank differences
  let sumD2 = 0;
  for (let a = 0; a < n; a++) {
    const d = rank1[a] - rank2[a];
    sumD2 += d * d;
  }

  // Spearman's rho
  return 1 - (6 * sumD2) / (n * (n * n - 1));
}

/**
 * Compute performance scores for all parties.
 * Score = Spearman correlation between party ideology and country reality ranking.
 * Higher = better (ideology matches reality).
 */
export function computeScores(game: GameState): { partyIndex: number; score: number; rank: number }[] {
  const realityRanking = computeRealityRanking(game);

  const scores = game.players.map((player) => {
    const ideologyRanking = player.ideology as number[];
    const score = spearmanCorrelation(ideologyRanking, realityRanking);
    return {
      partyIndex: player.partyIndex,
      score: Math.round(score * 1000) / 1000, // round to 3 decimals
      rank: 0,
    };
  });

  // Assign ranks (1 = best)
  scores.sort((a, b) => b.score - a.score);
  scores.forEach((s, i) => (s.rank = i + 1));

  // Re-sort by party index for consistent output
  scores.sort((a, b) => a.partyIndex - b.partyIndex);

  return scores;
}
