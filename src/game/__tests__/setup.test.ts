import { describe, it, expect } from 'vitest';
import { createGame } from '../setup';
import {
  NUM_ATTRIBUTES,
  NUM_PARTIES,
  NUM_STATES,
  INITIAL_BUDGET,
  IDEOLOGY_PRESETS,
} from '../types';

describe('createGame — structural invariants', () => {
  it('returns a GameState with IN_PROGRESS status', () => {
    const game = createGame(0);
    expect(game.status).toBe('IN_PROGRESS');
  });

  it('returns 6 states', () => {
    const game = createGame(0);
    expect(game.states).toHaveLength(NUM_STATES);
  });

  it('returns 6 players', () => {
    const game = createGame(0);
    expect(game.players).toHaveLength(NUM_PARTIES);
  });

  it('sets currentRound to 0', () => {
    const game = createGame(0);
    expect(game.currentRound).toBe(0);
  });

  it('sets currentPhase to POLLS', () => {
    const game = createGame(0);
    expect(game.currentPhase).toBe('POLLS');
  });

  it('firstDeputyElectionDone is false initially', () => {
    const game = createGame(0);
    expect(game.firstDeputyElectionDone).toBe(false);
  });

  it('each state has 8 attributes', () => {
    const game = createGame(0);
    for (const state of game.states) {
      expect(state.attributes).toHaveLength(NUM_ATTRIBUTES);
    }
  });

  it('each attribute has realQuality >= 0.5 (distributeStars floor)', () => {
    const game = createGame(0);
    for (const state of game.states) {
      for (const attr of state.attributes) {
        expect(attr.realQuality).toBeGreaterThanOrEqual(0.5);
      }
    }
  });

  it('perceivedIdeology is NUM_PARTIES x NUM_ATTRIBUTES for each state', () => {
    const game = createGame(0);
    for (const state of game.states) {
      expect(state.perceivedIdeology).toHaveLength(NUM_PARTIES);
      for (const row of state.perceivedIdeology) {
        expect(row).toHaveLength(NUM_ATTRIBUTES);
      }
    }
  });

  it('each player starts with INITIAL_BUDGET coins', () => {
    const game = createGame(0);
    for (const player of game.players) {
      expect(player.coins).toBe(INITIAL_BUDGET);
    }
  });

  it('player 0 is human', () => {
    const game = createGame(0);
    expect(game.players[0].isHuman).toBe(true);
    expect(game.players[0].isAI).toBe(false);
  });

  it('all other players are AI', () => {
    const game = createGame(0);
    for (let i = 1; i < NUM_PARTIES; i++) {
      expect(game.players[i].isAI).toBe(true);
      expect(game.players[i].isHuman).toBe(false);
    }
  });

  it('human player ideology matches the chosen preset', () => {
    const presetIndex = 0;
    const game = createGame(presetIndex);
    expect(game.players[0].ideology).toEqual(IDEOLOGY_PRESETS[presetIndex].ideology);
  });

  it('human player ideology matches preset 2 when preset 2 is chosen', () => {
    const presetIndex = 2;
    const game = createGame(presetIndex);
    expect(game.players[0].ideology).toEqual(IDEOLOGY_PRESETS[presetIndex].ideology);
  });

  it('each state has exactly 3 offices: GOVERNOR, SENATOR_1, SENATOR_2', () => {
    const game = createGame(0);
    for (const state of game.states) {
      expect(state.offices).toHaveLength(3);
      const types = state.offices.map((o) => o.type);
      expect(types).toContain('GOVERNOR');
      expect(types).toContain('SENATOR_1');
      expect(types).toContain('SENATOR_2');
    }
  });

  it('all governors are pre-assigned with expiresYear = 2', () => {
    const game = createGame(0);
    for (const state of game.states) {
      const gov = state.offices.find((o) => o.type === 'GOVERNOR')!;
      expect(gov.partyIndex).not.toBeNull();
      expect(gov.expiresYear).toBe(2);
      expect(gov.electedYear).toBe(-2);
    }
  });

  it('senator offices start vacant', () => {
    const game = createGame(0);
    for (const state of game.states) {
      const sen1 = state.offices.find((o) => o.type === 'SENATOR_1')!;
      const sen2 = state.offices.find((o) => o.type === 'SENATOR_2')!;
      expect(sen1.partyIndex).toBeNull();
      expect(sen2.partyIndex).toBeNull();
    }
  });

  it('maxRounds defaults to 12', () => {
    const game = createGame(0);
    expect(game.maxRounds).toBe(12);
  });

  it('maxRounds can be configured', () => {
    const game = createGame(0, 8);
    expect(game.maxRounds).toBe(8);
  });
});

describe('createGame — governor knowledge seeding', () => {
  it('human player knownInfo is populated for each state they govern', () => {
    const game = createGame(0);
    const humanPlayer = game.players[0];

    // Find which states the human governs
    const governedStateIndices = game.states
      .filter((s) => s.offices.find((o) => o.type === 'GOVERNOR')?.partyIndex === humanPlayer.partyIndex)
      .map((s) => s.stateIndex);

    // For each governed state, there should be NUM_ATTRIBUTES entries in knownInfo
    for (const stateIndex of governedStateIndices) {
      const entries = humanPlayer.knownInfo.filter((k) => k.stateIndex === stateIndex);
      expect(entries).toHaveLength(NUM_ATTRIBUTES);
    }
  });

  it('human player knownInfo has no entries for non-governed states', () => {
    const game = createGame(0);
    const humanPlayer = game.players[0];

    const nonGoverned = game.states.filter(
      (s) => s.offices.find((o) => o.type === 'GOVERNOR')?.partyIndex !== humanPlayer.partyIndex,
    );

    for (const state of nonGoverned) {
      const entries = humanPlayer.knownInfo.filter((k) => k.stateIndex === state.stateIndex);
      expect(entries).toHaveLength(0);
    }
  });

  it('knownInfo entries have correct expectation matching state attributes', () => {
    const game = createGame(0);
    const humanPlayer = game.players[0];

    for (const entry of humanPlayer.knownInfo) {
      const state = game.states[entry.stateIndex];
      const attr = state.attributes[entry.attributeIndex];
      expect(entry.expectation).toBe(attr.expectation);
    }
  });

  it('knownInfo entries have correct perceivedQuality matching state attributes', () => {
    const game = createGame(0);
    const humanPlayer = game.players[0];

    for (const entry of humanPlayer.knownInfo) {
      const state = game.states[entry.stateIndex];
      const attr = state.attributes[entry.attributeIndex];
      expect(entry.perceivedQuality).toBe(attr.perceivedQuality);
    }
  });

  it('knownInfo perceivedIdeology[p] matches state.perceivedIdeology[p][attr] for all parties', () => {
    const game = createGame(0);
    const humanPlayer = game.players[0];

    for (const entry of humanPlayer.knownInfo) {
      const state = game.states[entry.stateIndex];
      for (let p = 0; p < NUM_PARTIES; p++) {
        expect(entry.perceivedIdeology[p]).toBe(
          state.perceivedIdeology[p][entry.attributeIndex],
        );
      }
    }
  });

  it('AI players start with empty knownInfo', () => {
    const game = createGame(0);
    for (let i = 1; i < NUM_PARTIES; i++) {
      expect(game.players[i].knownInfo).toHaveLength(0);
    }
  });

  it('total knownInfo entries equals NUM_ATTRIBUTES per governed state', () => {
    const game = createGame(0);
    const humanPlayer = game.players[0];

    const governedCount = game.states.filter(
      (s) => s.offices.find((o) => o.type === 'GOVERNOR')?.partyIndex === humanPlayer.partyIndex,
    ).length;

    expect(humanPlayer.knownInfo).toHaveLength(governedCount * NUM_ATTRIBUTES);
  });
});
