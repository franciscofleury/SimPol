import { describe, it, expect } from 'vitest';
import { roundToHalf, executePoll, isGovernorOf } from '../polls';
import { COST_POLL, NUM_ATTRIBUTES, NUM_PARTIES } from '../types';
import { createMinimalGameState } from './fixtures';

describe('roundToHalf', () => {
  it('rounds 1.3 up to 1.5', () => {
    expect(roundToHalf(1.3)).toBe(1.5);
  });

  it('rounds 1.2 down to 1.0', () => {
    expect(roundToHalf(1.2)).toBe(1.0);
  });

  it('rounds 2.75 up to 3.0', () => {
    expect(roundToHalf(2.75)).toBe(3.0);
  });

  it('rounds 2.25 up to 2.5', () => {
    expect(roundToHalf(2.25)).toBe(2.5);
  });

  it('leaves exact 0.5 multiples unchanged', () => {
    expect(roundToHalf(2.0)).toBe(2.0);
    expect(roundToHalf(2.5)).toBe(2.5);
    expect(roundToHalf(3.5)).toBe(3.5);
  });

  it('handles 0', () => {
    expect(roundToHalf(0)).toBe(0);
  });
});

describe('executePoll', () => {
  it('returns null when player cannot afford the poll', () => {
    const game = createMinimalGameState();
    game.players[0].coins = COST_POLL - 1;
    expect(executePoll(game, 0, 0, 0)).toBeNull();
    expect(game.players[0].coins).toBe(COST_POLL - 1);
  });

  it('returns null for negative stateIndex', () => {
    const game = createMinimalGameState();
    expect(executePoll(game, 0, -1, 0)).toBeNull();
  });

  it('returns null for out-of-range stateIndex', () => {
    const game = createMinimalGameState();
    expect(executePoll(game, 0, 99, 0)).toBeNull();
  });

  it('returns null for negative attributeIndex', () => {
    const game = createMinimalGameState();
    expect(executePoll(game, 0, 0, -1)).toBeNull();
  });

  it('returns null for attributeIndex equal to NUM_ATTRIBUTES', () => {
    const game = createMinimalGameState();
    expect(executePoll(game, 0, 0, NUM_ATTRIBUTES)).toBeNull();
  });

  it('deducts COST_POLL coins on success', () => {
    const game = createMinimalGameState();
    game.players[0].coins = 100;
    executePoll(game, 0, 0, 0);
    expect(game.players[0].coins).toBe(100 - COST_POLL);
  });

  it('returns PollResult with correct stateIndex and attributeIndex', () => {
    const game = createMinimalGameState();
    const result = executePoll(game, 0, 1, 3);
    expect(result).not.toBeNull();
    expect(result!.stateIndex).toBe(1);
    expect(result!.attributeIndex).toBe(3);
  });

  it('PollResult.expectation matches state attribute expectation', () => {
    const game = createMinimalGameState();
    const expectedValue = 4.2;
    game.states[0].attributes[2].expectation = expectedValue;
    const result = executePoll(game, 0, 0, 2);
    expect(result!.expectation).toBe(expectedValue);
  });

  it('PollResult.perceivedQuality matches state attribute perceivedQuality', () => {
    const game = createMinimalGameState();
    const expectedValue = 2.7;
    game.states[0].attributes[2].perceivedQuality = expectedValue;
    const result = executePoll(game, 0, 0, 2);
    expect(result!.perceivedQuality).toBe(expectedValue);
  });

  it('PollResult.perceivedIdeology has length NUM_PARTIES', () => {
    const game = createMinimalGameState();
    const result = executePoll(game, 0, 0, 0);
    expect(result!.perceivedIdeology).toHaveLength(NUM_PARTIES);
  });

  it('PollResult.perceivedIdeology[p] equals state.perceivedIdeology[p][attributeIndex]', () => {
    const game = createMinimalGameState();
    const specificValue = 3.7;
    game.states[0].perceivedIdeology[3][2] = specificValue;
    const result = executePoll(game, 0, 0, 2);
    expect(result!.perceivedIdeology[3]).toBe(specificValue);
  });

  it('perceivedIdeology captures all parties — not just polled player', () => {
    const game = createMinimalGameState();
    // Set distinct values for each party
    for (let p = 0; p < NUM_PARTIES; p++) {
      game.states[0].perceivedIdeology[p][1] = p + 1.0;
    }
    const result = executePoll(game, 0, 0, 1);
    for (let p = 0; p < NUM_PARTIES; p++) {
      expect(result!.perceivedIdeology[p]).toBe(p + 1.0);
    }
  });

  it('poll result is appended to player.pollResults', () => {
    const game = createMinimalGameState();
    executePoll(game, 0, 0, 0);
    expect(game.players[0].pollResults).toHaveLength(1);
  });

  it('returns null for duplicate (stateIndex, attributeIndex) in the same round', () => {
    const game = createMinimalGameState();
    game.players[0].coins = 200;
    executePoll(game, 0, 0, 0); // first poll — succeeds
    const result2 = executePoll(game, 0, 0, 0); // duplicate
    expect(result2).toBeNull();
    expect(game.players[0].coins).toBe(200 - COST_POLL); // only deducted once
  });

  it('allows same (stateIndex, attributeIndex) in a different round', () => {
    const game = createMinimalGameState();
    game.players[0].coins = 200;
    game.currentRound = 0;
    executePoll(game, 0, 0, 0);
    game.currentRound = 1;
    const result2 = executePoll(game, 0, 0, 0);
    expect(result2).not.toBeNull();
  });

  it('PollResult.round matches current game round', () => {
    const game = createMinimalGameState();
    game.currentRound = 3;
    const result = executePoll(game, 0, 0, 0);
    expect(result!.round).toBe(3);
  });
});

describe('isGovernorOf', () => {
  it('returns true when player partyIndex matches governor office', () => {
    const game = createMinimalGameState();
    game.states[0].offices.find((o) => o.type === 'GOVERNOR')!.partyIndex = 0;
    expect(isGovernorOf(game, 0, 0)).toBe(true);
  });

  it('returns false when a different party is governor', () => {
    const game = createMinimalGameState();
    game.states[0].offices.find((o) => o.type === 'GOVERNOR')!.partyIndex = 1;
    expect(isGovernorOf(game, 0, 0)).toBe(false);
  });

  it('returns false when governor office is vacant (partyIndex null)', () => {
    const game = createMinimalGameState();
    // Fixture creates offices with partyIndex: null by default
    expect(isGovernorOf(game, 0, 0)).toBe(false);
  });

  it('returns true for a non-zero player partyIndex when they govern', () => {
    const game = createMinimalGameState();
    game.states[2].offices.find((o) => o.type === 'GOVERNOR')!.partyIndex = 3;
    expect(isGovernorOf(game, 3, 2)).toBe(true);
  });
});
