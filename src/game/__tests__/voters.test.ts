import { describe, it, expect } from 'vitest';
import { computeGaps, computeStateVotes } from '../voters';
import { NUM_ATTRIBUTES, NUM_PARTIES } from '../types';

describe('computeGaps', () => {
  it('returns element-wise expectation minus perceivedQuality', () => {
    const expectations = [3.5, 2.0, 4.0, 1.0, 2.5, 3.0, 1.5, 4.5];
    const perceivedQualities = [2.0, 2.5, 3.0, 1.5, 2.0, 1.0, 1.0, 3.0];
    const gaps = computeGaps(expectations, perceivedQualities);
    expect(gaps[0]).toBeCloseTo(1.5);
    expect(gaps[1]).toBeCloseTo(-0.5);
    expect(gaps[2]).toBeCloseTo(1.0);
    expect(gaps[3]).toBeCloseTo(-0.5);
  });

  it('returns array of same length as input', () => {
    const gaps = computeGaps(
      Array(NUM_ATTRIBUTES).fill(3),
      Array(NUM_ATTRIBUTES).fill(2),
    );
    expect(gaps).toHaveLength(NUM_ATTRIBUTES);
  });

  it('can produce negative gaps when perceived exceeds expectation', () => {
    const gaps = computeGaps([1.0], [2.0]);
    expect(gaps[0]).toBeCloseTo(-1.0);
  });

  it('returns zeros when expectations equal perceived qualities', () => {
    const gaps = computeGaps([2.0, 3.5], [2.0, 3.5]);
    expect(gaps[0]).toBeCloseTo(0);
    expect(gaps[1]).toBeCloseTo(0);
  });
});

describe('computeStateVotes', () => {
  /** Build a perceivedIdeologies matrix (NUM_PARTIES × NUM_ATTRIBUTES) */
  function makePerceivedIdeologies(defaultValue = 2.0): number[][] {
    return Array.from({ length: NUM_PARTIES }, () =>
      Array(NUM_ATTRIBUTES).fill(defaultValue),
    );
  }

  it('gives higher share to party with higher perceivedIdeology on the gap attribute', () => {
    // Only attr 0 has a positive gap
    const gaps = [2.0, 0, 0, 0, 0, 0, 0, 0];
    const perceivedIdeologies = makePerceivedIdeologies(1.0);
    // Party 0 has high perceived ideology on attr 0
    perceivedIdeologies[0][0] = 4.0;

    const { voteShares } = computeStateVotes(gaps, perceivedIdeologies);
    expect(voteShares[0]).toBeGreaterThan(voteShares[1]);
  });

  it('all vote shares sum to approximately 1.0', () => {
    const gaps = Array(NUM_ATTRIBUTES).fill(1.0);
    const perceivedIdeologies = makePerceivedIdeologies(2.0);
    const { voteShares } = computeStateVotes(gaps, perceivedIdeologies);
    const total = Object.values(voteShares).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1.0, 4);
  });

  it('no party gets a vote share of exactly 0 — floor of 0.001 applied', () => {
    const gaps = [1.0, 0, 0, 0, 0, 0, 0, 0];
    const perceivedIdeologies = makePerceivedIdeologies(2.0);
    // Party 5 has zero ideology on gap attribute
    perceivedIdeologies[5][0] = 0.0;

    const { voteShares } = computeStateVotes(gaps, perceivedIdeologies);
    expect(voteShares[5]).toBeGreaterThan(0);
  });

  it('uses equal weights when all gaps are non-positive', () => {
    // All gaps are negative — should fall back to equal weights
    const gaps = Array(NUM_ATTRIBUTES).fill(-1.0);
    const perceivedIdeologies = makePerceivedIdeologies(1.0);
    // Party 0 dominates all attributes
    perceivedIdeologies[0] = Array(NUM_ATTRIBUTES).fill(4.0);

    const { voteShares } = computeStateVotes(gaps, perceivedIdeologies);
    // Equal weights still score parties by ideology — party 0 still wins
    expect(voteShares[0]).toBeGreaterThan(voteShares[1]);
    // Shares still sum to 1
    const total = Object.values(voteShares).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1.0, 4);
  });

  it('positive gaps dominate scoring — only gap attributes influence result', () => {
    // Only attr 0 has positive gap — all other attrs have no weight
    const gaps = [2.0, -1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
    const perceivedIdeologies = makePerceivedIdeologies(1.0);
    perceivedIdeologies[0][0] = 4.0; // party 0 dominant on gap attr
    perceivedIdeologies[1][0] = 1.0; // party 1 weak on gap attr

    const { voteShares } = computeStateVotes(gaps, perceivedIdeologies);
    expect(voteShares[0]).toBeGreaterThan(voteShares[1]);
  });

  it('returns shares for exactly NUM_PARTIES parties', () => {
    const gaps = Array(NUM_ATTRIBUTES).fill(1.0);
    const perceivedIdeologies = makePerceivedIdeologies(2.0);
    const { voteShares } = computeStateVotes(gaps, perceivedIdeologies);
    expect(Object.keys(voteShares)).toHaveLength(NUM_PARTIES);
  });

  it('equal ideology across all parties produces equal vote shares', () => {
    const gaps = Array(NUM_ATTRIBUTES).fill(1.0);
    const perceivedIdeologies = makePerceivedIdeologies(2.0); // all the same
    const { voteShares } = computeStateVotes(gaps, perceivedIdeologies);
    const shares = Object.values(voteShares);
    const expectedShare = 1 / NUM_PARTIES;
    for (const share of shares) {
      expect(share).toBeCloseTo(expectedShare, 4);
    }
  });
});
