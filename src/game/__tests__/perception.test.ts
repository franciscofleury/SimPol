import { describe, it, expect } from 'vitest';
import { driftPerceptions } from '../perception';
import { createMinimalGameState, makeAttr } from './fixtures';
import { NUM_ATTRIBUTES, NUM_STATES } from '../types';

describe('driftPerceptions', () => {
  it('drifts perceivedQuality toward realQuality at 10% rate (pq < rq)', () => {
    const game = createMinimalGameState();
    game.states[0].attributes[0] = makeAttr(5.0, 0.0, 3.0);
    driftPerceptions(game);
    // 0.0 + (5.0 - 0.0) * 0.1 = 0.5
    expect(game.states[0].attributes[0].perceivedQuality).toBeCloseTo(0.5, 5);
  });

  it('drifts perceivedQuality toward realQuality when perceived > real', () => {
    const game = createMinimalGameState();
    game.states[0].attributes[0] = makeAttr(1.0, 4.0, 3.0);
    driftPerceptions(game);
    // 4.0 + (1.0 - 4.0) * 0.1 = 4.0 - 0.3 = 3.7
    expect(game.states[0].attributes[0].perceivedQuality).toBeCloseTo(3.7, 5);
  });

  it('does not overshoot — drift fraction is exactly 10%', () => {
    const game = createMinimalGameState();
    game.states[0].attributes[0] = makeAttr(3.0, 2.0, 3.0);
    driftPerceptions(game);
    // 2.0 + (3.0 - 2.0) * 0.1 = 2.1
    expect(game.states[0].attributes[0].perceivedQuality).toBeCloseTo(2.1, 5);
  });

  it('does not change perceivedQuality when already at realQuality', () => {
    const game = createMinimalGameState();
    game.states[0].attributes[0] = makeAttr(3.0, 3.0, 3.0);
    driftPerceptions(game);
    expect(game.states[0].attributes[0].perceivedQuality).toBeCloseTo(3.0, 5);
  });

  it('affects all states and all attributes', () => {
    const game = createMinimalGameState();
    // Set all attrs to pq=0, rq=5 — expect all to drift to 0.5
    for (const state of game.states) {
      for (let a = 0; a < NUM_ATTRIBUTES; a++) {
        state.attributes[a] = makeAttr(5.0, 0.0, 3.0);
      }
    }
    driftPerceptions(game);
    for (const state of game.states) {
      for (const attr of state.attributes) {
        expect(attr.perceivedQuality).toBeCloseTo(0.5, 5);
      }
    }
  });

  it('expectation stays >= 0 after noise, even when expectation starts at 0', () => {
    const game = createMinimalGameState();
    for (const state of game.states) {
      for (const attr of state.attributes) {
        attr.expectation = 0.0;
      }
    }
    driftPerceptions(game);
    for (const state of game.states) {
      for (const attr of state.attributes) {
        expect(attr.expectation).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('expectation changes by at most 0.1 in either direction', () => {
    const game = createMinimalGameState();
    const originalExpectation = 2.0;
    game.states[0].attributes[0] = makeAttr(3.0, 2.0, originalExpectation);
    driftPerceptions(game);
    const newExpectation = game.states[0].attributes[0].expectation;
    expect(newExpectation).toBeGreaterThanOrEqual(originalExpectation - 0.1);
    expect(newExpectation).toBeLessThanOrEqual(originalExpectation + 0.1);
  });

  it('mutates game state in place', () => {
    const game = createMinimalGameState();
    const originalPQ = game.states[0].attributes[0].perceivedQuality;
    game.states[0].attributes[0].realQuality = originalPQ + 10.0; // create drift
    driftPerceptions(game);
    expect(game.states[0].attributes[0].perceivedQuality).not.toBe(originalPQ);
  });

  it('perceivedQuality drift is applied to all 6 states independently', () => {
    const game = createMinimalGameState();
    // Each state gets different rq/pq values
    for (let s = 0; s < NUM_STATES; s++) {
      game.states[s].attributes[0] = makeAttr(s + 1.0, 0.0, 3.0);
    }
    driftPerceptions(game);
    for (let s = 0; s < NUM_STATES; s++) {
      const expected = (s + 1.0) * 0.1;
      expect(game.states[s].attributes[0].perceivedQuality).toBeCloseTo(expected, 5);
    }
  });
});
