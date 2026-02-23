import { describe, it, expect } from 'vitest';
import { computeRealityRanking, spearmanCorrelation, computeScores } from '../scoring';
import { NUM_ATTRIBUTES, NUM_PARTIES } from '../types';
import { createMinimalGameState, makeAttr } from './fixtures';

describe('computeRealityRanking', () => {
  it('returns attribute indices sorted by descending average realQuality', () => {
    const game = createMinimalGameState();
    // Set single state with distinct realQuality values
    // attr 1 = 5.0 (highest), attr 2 = 3.0, attr 0 = 1.0 (lowest among first 3)
    game.states.forEach((state) => {
      state.attributes[0] = makeAttr(1.0, 1.0, 1.0);
      state.attributes[1] = makeAttr(5.0, 5.0, 5.0);
      state.attributes[2] = makeAttr(3.0, 3.0, 3.0);
      state.attributes[3] = makeAttr(2.0, 2.0, 2.0);
      state.attributes[4] = makeAttr(4.0, 4.0, 4.0);
      state.attributes[5] = makeAttr(1.5, 1.5, 1.5);
      state.attributes[6] = makeAttr(2.5, 2.5, 2.5);
      state.attributes[7] = makeAttr(0.5, 0.5, 0.5);
    });

    const ranking = computeRealityRanking(game);
    expect(ranking[0]).toBe(1); // highest realQuality = attr 1 (5.0)
    expect(ranking[ranking.length - 1]).toBe(7); // lowest = attr 7 (0.5)
  });

  it('averages realQuality across multiple states', () => {
    const game = createMinimalGameState();
    // State 0: attr 0 = 4.0, attr 1 = 2.0
    // State 1: attr 0 = 2.0, attr 1 = 4.0
    // Averages: both = 3.0 (tie)
    game.states[0].attributes[0].realQuality = 4.0;
    game.states[0].attributes[1].realQuality = 2.0;
    game.states[1].attributes[0].realQuality = 2.0;
    game.states[1].attributes[1].realQuality = 4.0;

    const ranking = computeRealityRanking(game);
    expect(ranking).toHaveLength(NUM_ATTRIBUTES);
  });

  it('returns an array of length NUM_ATTRIBUTES', () => {
    const game = createMinimalGameState();
    const ranking = computeRealityRanking(game);
    expect(ranking).toHaveLength(NUM_ATTRIBUTES);
  });

  it('returned ranking is a permutation of attribute indices 0..7', () => {
    const game = createMinimalGameState();
    const ranking = computeRealityRanking(game);
    const sorted = [...ranking].sort((a, b) => a - b);
    expect(sorted).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });
});

describe('spearmanCorrelation', () => {
  it('returns 1.0 for identical rankings', () => {
    const ranking = [0, 1, 2, 3, 4, 5, 6, 7];
    expect(spearmanCorrelation(ranking, ranking)).toBeCloseTo(1.0, 10);
  });

  it('returns -1.0 for perfectly inverted rankings', () => {
    // ranking1: attr 0 = rank 1, attr 7 = rank 8
    // ranking2: attr 7 = rank 1, attr 0 = rank 8
    // sumD² = 49+25+9+1+1+9+25+49 = 168
    // rho = 1 - 6*168 / (8*63) = 1 - 1008/504 = -1
    const ranking1 = [0, 1, 2, 3, 4, 5, 6, 7];
    const ranking2 = [7, 6, 5, 4, 3, 2, 1, 0];
    expect(spearmanCorrelation(ranking1, ranking2)).toBeCloseTo(-1.0, 10);
  });

  it('returns a value between -1 and 1 for arbitrary rankings', () => {
    const ranking1 = [0, 1, 2, 3, 4, 5, 6, 7];
    const ranking2 = [1, 0, 3, 2, 5, 4, 7, 6]; // pairwise swaps
    const rho = spearmanCorrelation(ranking1, ranking2);
    expect(rho).toBeGreaterThanOrEqual(-1.0);
    expect(rho).toBeLessThanOrEqual(1.0);
  });

  it('pairwise-swapped ranking has high positive correlation', () => {
    // Swapping adjacent pairs creates small differences → still close to 1
    const ranking1 = [0, 1, 2, 3, 4, 5, 6, 7];
    const ranking2 = [1, 0, 3, 2, 5, 4, 7, 6];
    // Each pair swapped: d = ±1, sumD² = 8, rho = 1 - 6*8/504 ≈ 0.905
    const rho = spearmanCorrelation(ranking1, ranking2);
    expect(rho).toBeCloseTo(1 - (6 * 8) / (8 * 63), 5);
  });
});

describe('computeScores', () => {
  it('assigns rank 1 to the party whose ideology best matches reality', () => {
    const game = createMinimalGameState();
    // Set all states: attr 0 has the highest realQuality → it will be rank 1 in reality
    game.states.forEach((state) => {
      state.attributes[0].realQuality = 5.0;
      for (let a = 1; a < NUM_ATTRIBUTES; a++) {
        state.attributes[a].realQuality = (NUM_ATTRIBUTES - a) * 0.5;
      }
    });

    // Party 0: ideology = [0,1,2,3,4,5,6,7] — attr 0 ranked 1st (matches reality)
    // Party 1: ideology = [7,6,5,4,3,2,1,0] — inverted (attr 7 ranked 1st)
    game.players[0].ideology = [0, 1, 2, 3, 4, 5, 6, 7];
    game.players[1].ideology = [7, 6, 5, 4, 3, 2, 1, 0];

    const scores = computeScores(game);
    const party0 = scores.find((s) => s.partyIndex === 0)!;
    const party1 = scores.find((s) => s.partyIndex === 1)!;
    expect(party0.rank).toBeLessThan(party1.rank);
  });

  it('returns array length equal to number of players', () => {
    const game = createMinimalGameState();
    const scores = computeScores(game);
    expect(scores).toHaveLength(NUM_PARTIES);
  });

  it('output is sorted by partyIndex', () => {
    const game = createMinimalGameState();
    const scores = computeScores(game);
    scores.forEach((s, i) => {
      expect(s.partyIndex).toBe(i);
    });
  });

  it('all ranks are assigned 1 through NUM_PARTIES with no gaps', () => {
    const game = createMinimalGameState();
    const scores = computeScores(game);
    const ranks = new Set(scores.map((s) => s.rank));
    for (let r = 1; r <= NUM_PARTIES; r++) {
      expect(ranks.has(r)).toBe(true);
    }
  });

  it('scores have at most 3 decimal places', () => {
    const game = createMinimalGameState();
    const scores = computeScores(game);
    for (const s of scores) {
      const rounded = Math.round(s.score * 1000) / 1000;
      expect(s.score).toBe(rounded);
    }
  });
});
