import { NUM_ATTRIBUTES, NUM_PARTIES } from './types';

export interface VoteResult {
  /** partyIndex -> fraction of votes in [0,1], sums to 1 */
  voteShares: Record<number, number>;
}

/**
 * Compute vote shares for all parties in a single state.
 *
 * The formula is GAP-weighted ideology matching:
 * 1. GAP weights: only positive gaps (unmet needs) matter
 * 2. Each party scored by weighted sum of perceived ideology
 * 3. Vote shares are proportional to scores
 */
export function computeStateVotes(
  gaps: number[], // length 8: expectation - perceivedQuality per attribute
  perceivedIdeologies: number[][], // [NUM_PARTIES][NUM_ATTRIBUTES]
): VoteResult {
  // Step 1: Compute weights from GAPs (only positive gaps create demand)
  const weights = gaps.map((g) => Math.max(0, g));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  // If no positive gaps, equal weight to all attributes
  const normalizedWeights =
    totalWeight > 0
      ? weights.map((w) => w / totalWeight)
      : weights.map(() => 1 / NUM_ATTRIBUTES);

  // Step 2: Score each party = weighted sum of perceived ideology
  const scores: number[] = [];
  for (let p = 0; p < NUM_PARTIES; p++) {
    let score = 0;
    for (let a = 0; a < NUM_ATTRIBUTES; a++) {
      score += normalizedWeights[a] * perceivedIdeologies[p][a];
    }
    // Small floor to prevent zero-vote parties
    scores.push(Math.max(score, 0.001));
  }

  // Step 3: Convert scores to vote shares (proportional)
  const totalScore = scores.reduce((a, b) => a + b, 0);
  const voteShares: Record<number, number> = {};
  for (let p = 0; p < NUM_PARTIES; p++) {
    voteShares[p] = totalScore > 0 ? scores[p] / totalScore : 1 / NUM_PARTIES;
  }

  return { voteShares };
}

/**
 * Compute gaps for a state's attributes.
 */
export function computeGaps(
  expectations: number[],
  perceivedQualities: number[],
): number[] {
  return expectations.map((exp, i) => exp - perceivedQualities[i]);
}
