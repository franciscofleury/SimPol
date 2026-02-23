import { describe, it, expect } from 'vitest';
import { dHondt, plurality, runElections } from '../elections';
import { NUM_PARTIES } from '../types';
import { createMinimalGameState } from './fixtures';

describe('dHondt', () => {
  it('allocates all seats', () => {
    const voteShares = { 0: 0.5, 1: 0.3, 2: 0.2 };
    const seats = dHondt(voteShares, 10);
    const total = Object.values(seats).reduce((a, b) => a + b, 0);
    expect(total).toBe(10);
  });

  it('proportionally favors highest vote-share party', () => {
    const voteShares = { 0: 0.6, 1: 0.4 };
    const seats = dHondt(voteShares, 10);
    expect(seats[0]).toBeGreaterThan(seats[1]);
  });

  it('known result: {0:0.5, 1:0.3, 2:0.2} x 10 seats → {0:5, 1:3, 2:2}', () => {
    const voteShares = { 0: 0.5, 1: 0.3, 2: 0.2 };
    const seats = dHondt(voteShares, 10);
    expect(seats[0]).toBe(5);
    expect(seats[1]).toBe(3);
    expect(seats[2]).toBe(2);
  });

  it('party with 100% vote share gets all seats', () => {
    const voteShares: Record<number, number> = {};
    for (let p = 0; p < NUM_PARTIES; p++) voteShares[p] = 0.0;
    voteShares[0] = 1.0;
    const seats = dHondt(voteShares, 30);
    expect(seats[0]).toBe(30);
    for (let p = 1; p < NUM_PARTIES; p++) expect(seats[p]).toBe(0);
  });

  it('equal vote shares split seats evenly', () => {
    const voteShares = { 0: 0.5, 1: 0.5 };
    const seats = dHondt(voteShares, 4);
    expect(seats[0] + seats[1]).toBe(4);
    expect(seats[0]).toBe(2);
    expect(seats[1]).toBe(2);
  });

  it('returns a record with all input party keys initialized', () => {
    const voteShares = { 0: 0.4, 1: 0.3, 2: 0.2, 3: 0.1 };
    const seats = dHondt(voteShares, 5);
    for (const p of [0, 1, 2, 3]) {
      expect(p in seats).toBe(true);
    }
  });

  it('total allocated seats always equals totalSeats', () => {
    const voteShares: Record<number, number> = {};
    for (let p = 0; p < NUM_PARTIES; p++) voteShares[p] = 1 / NUM_PARTIES;
    for (const totalSeats of [10, 30, 40, 50]) {
      const seats = dHondt(voteShares, totalSeats);
      const total = Object.values(seats).reduce((a, b) => a + b, 0);
      expect(total).toBe(totalSeats);
    }
  });
});

describe('plurality', () => {
  it('returns party index with highest vote share', () => {
    const voteShares = { 0: 0.1, 1: 0.6, 2: 0.3 };
    expect(plurality(voteShares)).toBe(1);
  });

  it('breaks ties by returning the party that appears first in numeric key order', () => {
    // Object.entries iterates numeric keys in ascending order in V8
    const voteShares = { 0: 0.5, 1: 0.5, 2: 0.0 };
    expect(plurality(voteShares)).toBe(0);
  });

  it('works with a single-party field', () => {
    expect(plurality({ 3: 1.0 })).toBe(3);
  });

  it('returns correct winner when party with highest share is not party 0', () => {
    const voteShares = { 0: 0.1, 1: 0.2, 2: 0.7 };
    expect(plurality(voteShares)).toBe(2);
  });
});

describe('runElections', () => {
  describe('year 0 — DEPUTIES + SENATORS', () => {
    it('sets firstDeputyElectionDone to true', () => {
      const game = createMinimalGameState({ currentRound: 0 });
      runElections(game);
      expect(game.firstDeputyElectionDone).toBe(true);
    });

    it('returns result with DEPUTIES and SENATORS types', () => {
      const game = createMinimalGameState({ currentRound: 0 });
      const result = runElections(game);
      expect(result).not.toBeNull();
      expect(result!.types).toContain('DEPUTIES');
      expect(result!.types).toContain('SENATORS');
    });

    it('returns deputyResults and senatorResults, not governorResults', () => {
      const game = createMinimalGameState({ currentRound: 0 });
      const result = runElections(game);
      expect(result!.deputyResults).toBeDefined();
      expect(result!.senatorResults).toBeDefined();
      expect(result!.governorResults).toBeUndefined();
    });

    it('total deputies across parties equals state.deputies for each state', () => {
      const game = createMinimalGameState({ currentRound: 0 });
      const result = runElections(game);
      for (const state of game.states) {
        const stateSeats = result!.deputyResults![state.stateIndex];
        const total = Object.values(stateSeats).reduce((a, b) => a + b, 0);
        expect(total).toBe(state.deputies);
      }
    });

    it('deputyAllocation on each state matches election result', () => {
      const game = createMinimalGameState({ currentRound: 0 });
      const result = runElections(game);
      for (const state of game.states) {
        for (let p = 0; p < NUM_PARTIES; p++) {
          expect(state.deputyAllocation[p]).toBe(
            result!.deputyResults![state.stateIndex][p] || 0,
          );
        }
      }
    });

    it('senator offices are assigned to top 2 parties', () => {
      const game = createMinimalGameState({ currentRound: 0 });
      // Make party 0 dominant: high perceivedIdeology on all attrs with positive gaps
      game.states.forEach((state) => {
        state.perceivedIdeology[0] = Array(8).fill(4.0);
        state.perceivedIdeology[1] = Array(8).fill(3.0);
        for (let p = 2; p < NUM_PARTIES; p++) {
          state.perceivedIdeology[p] = Array(8).fill(1.0);
        }
      });
      runElections(game);
      for (const state of game.states) {
        const sen1 = state.offices.find((o) => o.type === 'SENATOR_1')!;
        const sen2 = state.offices.find((o) => o.type === 'SENATOR_2')!;
        // Top 2 should be party 0 and party 1
        expect([0, 1]).toContain(sen1.partyIndex);
        expect([0, 1]).toContain(sen2.partyIndex);
        expect(sen1.partyIndex).not.toBe(sen2.partyIndex);
      }
    });

    it('senator offices have expiresYear = currentRound + 6', () => {
      const game = createMinimalGameState({ currentRound: 0 });
      runElections(game);
      for (const state of game.states) {
        const sen1 = state.offices.find((o) => o.type === 'SENATOR_1')!;
        expect(sen1.expiresYear).toBe(6);
        expect(sen1.electedYear).toBe(0);
      }
    });
  });

  describe('year 2 — GOVERNORS only', () => {
    it('returns result with only GOVERNORS type', () => {
      const game = createMinimalGameState({ currentRound: 2 });
      const result = runElections(game);
      expect(result).not.toBeNull();
      expect(result!.types).toEqual(['GOVERNORS']);
    });

    it('returns governorResults and no deputy or senator results', () => {
      const game = createMinimalGameState({ currentRound: 2 });
      const result = runElections(game);
      expect(result!.governorResults).toBeDefined();
      expect(result!.deputyResults).toBeUndefined();
      expect(result!.senatorResults).toBeUndefined();
    });

    it('governor offices updated with correct electedYear and expiresYear', () => {
      const game = createMinimalGameState({ currentRound: 2 });
      runElections(game);
      for (const state of game.states) {
        const gov = state.offices.find((o) => o.type === 'GOVERNOR')!;
        expect(gov.partyIndex).not.toBeNull();
        expect(gov.electedYear).toBe(2);
        expect(gov.expiresYear).toBe(6);
      }
    });

    it('does not change firstDeputyElectionDone', () => {
      const game = createMinimalGameState({ currentRound: 2, firstDeputyElectionDone: false });
      runElections(game);
      expect(game.firstDeputyElectionDone).toBe(false);
    });
  });

  describe('non-election year', () => {
    it('returns null for year 1', () => {
      const game = createMinimalGameState({ currentRound: 1 });
      expect(runElections(game)).toBeNull();
    });

    it('returns null for year 3', () => {
      const game = createMinimalGameState({ currentRound: 3 });
      expect(runElections(game)).toBeNull();
    });
  });

  describe('year 6 — GOVERNORS + SENATORS', () => {
    it('returns both GOVERNORS and SENATORS types', () => {
      const game = createMinimalGameState({ currentRound: 6, firstDeputyElectionDone: true });
      const result = runElections(game);
      expect(result!.types).toContain('GOVERNORS');
      expect(result!.types).toContain('SENATORS');
    });
  });
});
