import { describe, it, expect } from 'vitest';
import { canAfford, spendCoins, distributeAnnualIncome } from '../economy';
import { INITIAL_BUDGET, NUM_PARTIES } from '../types';
import { createMinimalGameState } from './fixtures';

describe('canAfford', () => {
  it('returns true when player has exactly the required coins', () => {
    const game = createMinimalGameState();
    game.players[0].coins = 10;
    expect(canAfford(game, 0, 10)).toBe(true);
  });

  it('returns true when player has more than required coins', () => {
    const game = createMinimalGameState();
    game.players[0].coins = 100;
    expect(canAfford(game, 0, 25)).toBe(true);
  });

  it('returns false when player has fewer coins than required', () => {
    const game = createMinimalGameState();
    game.players[0].coins = 5;
    expect(canAfford(game, 0, 10)).toBe(false);
  });

  it('returns false when player has 0 coins', () => {
    const game = createMinimalGameState();
    game.players[0].coins = 0;
    expect(canAfford(game, 0, 1)).toBe(false);
  });
});

describe('spendCoins', () => {
  it('deducts the exact amount from player coins', () => {
    const game = createMinimalGameState();
    game.players[0].coins = 100;
    spendCoins(game, 0, 25);
    expect(game.players[0].coins).toBe(75);
  });

  it('can deduct to zero', () => {
    const game = createMinimalGameState();
    game.players[0].coins = 10;
    spendCoins(game, 0, 10);
    expect(game.players[0].coins).toBe(0);
  });

  it('only affects the specified player, not others', () => {
    const game = createMinimalGameState();
    game.players.forEach((p) => (p.coins = 100));
    spendCoins(game, 2, 30);
    expect(game.players[0].coins).toBe(100);
    expect(game.players[1].coins).toBe(100);
    expect(game.players[2].coins).toBe(70);
    expect(game.players[3].coins).toBe(100);
  });
});

describe('distributeAnnualIncome', () => {
  it('does nothing when firstDeputyElectionDone is false', () => {
    const game = createMinimalGameState();
    game.firstDeputyElectionDone = false;
    const coinsBefore = game.players.map((p) => p.coins);
    distributeAnnualIncome(game);
    game.players.forEach((p, i) => {
      expect(p.coins).toBe(coinsBefore[i]);
    });
  });

  it('adds income when firstDeputyElectionDone is true', () => {
    const game = createMinimalGameState();
    game.firstDeputyElectionDone = true;
    const coinsBefore = game.players.map((p) => p.coins);
    distributeAnnualIncome(game);
    const coinsAfter = game.players.map((p) => p.coins);
    const totalAdded = coinsAfter.reduce((a, b) => a + b, 0) - coinsBefore.reduce((a, b) => a + b, 0);
    // 120+120+100+100+80+80 = 600 total distributed
    expect(totalAdded).toBe(600);
  });

  it('top 2 parties by deputy count receive 120 coins each', () => {
    const game = createMinimalGameState();
    game.firstDeputyElectionDone = true;
    // Party 0 gets most deputies, party 1 second most
    game.states[0].deputyAllocation[0] = 50;
    game.states[0].deputyAllocation[1] = 40;
    // Parties 2-5 get 5 each
    for (let p = 2; p < NUM_PARTIES; p++) {
      game.states[0].deputyAllocation[p] = 5;
    }
    const coinsBefore = game.players.map((p) => p.coins);
    distributeAnnualIncome(game);
    expect(game.players[0].coins).toBe(coinsBefore[0] + 120);
    expect(game.players[1].coins).toBe(coinsBefore[1] + 120);
  });

  it('bottom 2 parties receive 80 coins each', () => {
    const game = createMinimalGameState();
    game.firstDeputyElectionDone = true;
    // Give parties 0-3 many deputies, parties 4 and 5 few
    game.states[0].deputyAllocation[0] = 50;
    game.states[0].deputyAllocation[1] = 40;
    game.states[0].deputyAllocation[2] = 30;
    game.states[0].deputyAllocation[3] = 20;
    game.states[0].deputyAllocation[4] = 5;
    game.states[0].deputyAllocation[5] = 2;
    const coinsBefore = game.players.map((p) => p.coins);
    distributeAnnualIncome(game);
    expect(game.players[4].coins).toBe(coinsBefore[4] + 80);
    expect(game.players[5].coins).toBe(coinsBefore[5] + 80);
  });

  it('middle 2 parties receive 100 coins each', () => {
    const game = createMinimalGameState();
    game.firstDeputyElectionDone = true;
    game.states[0].deputyAllocation[0] = 50;
    game.states[0].deputyAllocation[1] = 40;
    game.states[0].deputyAllocation[2] = 30;
    game.states[0].deputyAllocation[3] = 20;
    game.states[0].deputyAllocation[4] = 5;
    game.states[0].deputyAllocation[5] = 2;
    const coinsBefore = game.players.map((p) => p.coins);
    distributeAnnualIncome(game);
    expect(game.players[2].coins).toBe(coinsBefore[2] + 100);
    expect(game.players[3].coins).toBe(coinsBefore[3] + 100);
  });

  it('ties in deputy count are broken by party index (lower index ranked higher)', () => {
    const game = createMinimalGameState();
    game.firstDeputyElectionDone = true;
    // All parties have equal deputies (0 from fixture) — tie broken by party index
    const coinsBefore = game.players.map((p) => p.coins);
    distributeAnnualIncome(game);
    expect(game.players[0].coins).toBe(coinsBefore[0] + 120);
    expect(game.players[1].coins).toBe(coinsBefore[1] + 120);
    expect(game.players[2].coins).toBe(coinsBefore[2] + 100);
    expect(game.players[3].coins).toBe(coinsBefore[3] + 100);
    expect(game.players[4].coins).toBe(coinsBefore[4] + 80);
    expect(game.players[5].coins).toBe(coinsBefore[5] + 80);
  });
});
