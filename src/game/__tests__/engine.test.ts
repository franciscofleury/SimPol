import { describe, it, expect, vi } from 'vitest';
import { allPlayersReady, advancePhase, playerReady, startGame } from '../engine';
import { createMinimalGameState } from './fixtures';
import { NUM_PARTIES } from '../types';

// Mock AI to prevent random behavior from affecting phase-transition tests
vi.mock('../ai', () => ({ executeAITurn: vi.fn() }));

describe('allPlayersReady', () => {
  it('returns false when no player is ready', () => {
    const game = createMinimalGameState();
    expect(allPlayersReady(game)).toBe(false);
  });

  it('returns false when only some players are ready', () => {
    const game = createMinimalGameState();
    game.players[0].isReady = true;
    expect(allPlayersReady(game)).toBe(false);
  });

  it('returns true when all players are ready', () => {
    const game = createMinimalGameState();
    game.players.forEach((p) => (p.isReady = true));
    expect(allPlayersReady(game)).toBe(true);
  });
});

describe('startGame', () => {
  it('sets currentRound to 0', () => {
    const game = createMinimalGameState({ currentRound: 5 });
    startGame(game);
    expect(game.currentRound).toBe(0);
  });

  it('sets currentPhase to POLLS', () => {
    const game = createMinimalGameState({ currentPhase: 'CAMPAIGNS' });
    startGame(game);
    expect(game.currentPhase).toBe('POLLS');
  });

  it('resets all player isReady to false', () => {
    const game = createMinimalGameState();
    game.players.forEach((p) => (p.isReady = true));
    startGame(game);
    expect(game.players.every((p) => !p.isReady)).toBe(true);
  });

  it('returns a non-empty string message', () => {
    const game = createMinimalGameState();
    const msg = startGame(game);
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });
});

describe('advancePhase from POLLS', () => {
  it('transitions currentPhase to CAMPAIGNS', () => {
    const game = createMinimalGameState({ currentPhase: 'POLLS' });
    advancePhase(game);
    expect(game.currentPhase).toBe('CAMPAIGNS');
  });

  it('resets all player isReady flags', () => {
    const game = createMinimalGameState({ currentPhase: 'POLLS' });
    game.players.forEach((p) => (p.isReady = true));
    advancePhase(game);
    expect(game.players.every((p) => !p.isReady)).toBe(true);
  });

  it('returns a string message', () => {
    const game = createMinimalGameState({ currentPhase: 'POLLS' });
    const msg = advancePhase(game);
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });

  it('does not increment currentRound', () => {
    const game = createMinimalGameState({ currentPhase: 'POLLS', currentRound: 1 });
    advancePhase(game);
    expect(game.currentRound).toBe(1);
  });
});

describe('advancePhase from CAMPAIGNS — non-election year (year 1)', () => {
  it('increments currentRound and sets phase to POLLS', () => {
    const game = createMinimalGameState({ currentPhase: 'CAMPAIGNS', currentRound: 1 });
    advancePhase(game);
    expect(game.currentRound).toBe(2);
    expect(game.currentPhase).toBe('POLLS');
  });

  it('does not set firstDeputyElectionDone on non-election year', () => {
    const game = createMinimalGameState({
      currentPhase: 'CAMPAIGNS',
      currentRound: 1,
      firstDeputyElectionDone: false,
    });
    advancePhase(game);
    expect(game.firstDeputyElectionDone).toBe(false);
  });

  it('records round data without election result', () => {
    const game = createMinimalGameState({ currentPhase: 'CAMPAIGNS', currentRound: 1 });
    advancePhase(game);
    const round = game.rounds.find((r) => r.number === 1);
    expect(round).toBeDefined();
    expect(round!.electionResult).toBeUndefined();
  });
});

describe('advancePhase from CAMPAIGNS — election year 0', () => {
  it('sets firstDeputyElectionDone to true', () => {
    const game = createMinimalGameState({ currentPhase: 'CAMPAIGNS', currentRound: 0 });
    advancePhase(game);
    expect(game.firstDeputyElectionDone).toBe(true);
  });

  it('records election result in game.rounds', () => {
    const game = createMinimalGameState({ currentPhase: 'CAMPAIGNS', currentRound: 0 });
    advancePhase(game);
    const round = game.rounds.find((r) => r.number === 0);
    expect(round).toBeDefined();
    expect(round!.electionResult).toBeDefined();
  });

  it('advances to round 1 with POLLS phase after year 0', () => {
    const game = createMinimalGameState({ currentPhase: 'CAMPAIGNS', currentRound: 0 });
    advancePhase(game);
    expect(game.currentRound).toBe(1);
    expect(game.currentPhase).toBe('POLLS');
  });
});

describe('advancePhase — game end at maxRounds', () => {
  it('sets status to FINISHED when currentRound reaches maxRounds', () => {
    // Year 12 is an election year; game ends after processing
    const game = createMinimalGameState({
      currentPhase: 'CAMPAIGNS',
      currentRound: 12,
      maxRounds: 12,
    });
    advancePhase(game);
    expect(game.status).toBe('FINISHED');
  });

  it('does not increment round beyond maxRounds', () => {
    const game = createMinimalGameState({
      currentPhase: 'CAMPAIGNS',
      currentRound: 12,
      maxRounds: 12,
    });
    advancePhase(game);
    expect(game.currentRound).toBe(12);
  });

  it('sets status to FINISHED for non-election last round', () => {
    const game = createMinimalGameState({
      currentPhase: 'CAMPAIGNS',
      currentRound: 9,
      maxRounds: 9,
    });
    advancePhase(game);
    expect(game.status).toBe('FINISHED');
  });
});

describe('playerReady', () => {
  it('marks the specified player as ready', () => {
    const game = createMinimalGameState();
    playerReady(game, 2);
    expect(game.players[2].isReady).toBe(true);
  });

  it('does not advance phase when not all players ready', () => {
    const game = createMinimalGameState({ currentPhase: 'POLLS' });
    playerReady(game, 0); // only 1 of 6 ready
    expect(game.currentPhase).toBe('POLLS');
  });

  it('returns a string message', () => {
    const game = createMinimalGameState();
    const msg = playerReady(game, 0);
    expect(typeof msg).toBe('string');
  });

  it('advances phase when last player becomes ready', () => {
    const game = createMinimalGameState({ currentPhase: 'POLLS' });
    // Mark all but last as ready
    for (let i = 0; i < NUM_PARTIES - 1; i++) {
      game.players[i].isReady = true;
    }
    playerReady(game, NUM_PARTIES - 1); // last one
    expect(game.currentPhase).toBe('CAMPAIGNS');
  });

  it('does not change other players isReady status', () => {
    const game = createMinimalGameState();
    game.players[1].isReady = true;
    playerReady(game, 2);
    expect(game.players[1].isReady).toBe(true);
    expect(game.players[0].isReady).toBe(false);
  });
});
