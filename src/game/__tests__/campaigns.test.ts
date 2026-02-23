import { describe, it, expect } from 'vitest';
import { executeCampaign } from '../campaigns';
import { COST_CAMPAIGN, NUM_ATTRIBUTES, NUM_PARTIES } from '../types';
import { createMinimalGameState } from './fixtures';

describe('executeCampaign', () => {
  it('returns null when player cannot afford the campaign', () => {
    const game = createMinimalGameState();
    game.players[0].coins = COST_CAMPAIGN - 1;
    expect(executeCampaign(game, 0, 0, 0)).toBeNull();
    expect(game.players[0].coins).toBe(COST_CAMPAIGN - 1);
  });

  it('returns null for negative stateIndex', () => {
    const game = createMinimalGameState();
    expect(executeCampaign(game, 0, -1, 0)).toBeNull();
  });

  it('returns null for out-of-range stateIndex', () => {
    const game = createMinimalGameState();
    expect(executeCampaign(game, 0, 99, 0)).toBeNull();
  });

  it('returns null for negative attributeIndex', () => {
    const game = createMinimalGameState();
    expect(executeCampaign(game, 0, 0, -1)).toBeNull();
  });

  it('returns null for attributeIndex equal to NUM_ATTRIBUTES', () => {
    const game = createMinimalGameState();
    expect(executeCampaign(game, 0, 0, NUM_ATTRIBUTES)).toBeNull();
  });

  it('deducts COST_CAMPAIGN coins on success', () => {
    const game = createMinimalGameState();
    game.players[0].coins = 100;
    executeCampaign(game, 0, 0, 0);
    expect(game.players[0].coins).toBe(100 - COST_CAMPAIGN);
  });

  it('increases perceivedIdeology[playerIndex][attributeIndex] by 0.5', () => {
    const game = createMinimalGameState();
    game.states[0].perceivedIdeology[0][2] = 2.0;
    executeCampaign(game, 0, 0, 2);
    expect(game.states[0].perceivedIdeology[0][2]).toBeCloseTo(2.5);
  });

  it('does not change perceivedIdeology for other attributes', () => {
    const game = createMinimalGameState();
    // All attrs set to 2.0 by fixture
    executeCampaign(game, 0, 0, 3); // campaign on attr 3
    expect(game.states[0].perceivedIdeology[0][0]).toBeCloseTo(2.0);
    expect(game.states[0].perceivedIdeology[0][7]).toBeCloseTo(2.0);
  });

  it('does not change perceivedIdeology for other parties', () => {
    const game = createMinimalGameState();
    game.states[0].perceivedIdeology[1][3] = 2.0;
    executeCampaign(game, 0, 0, 3); // campaign for player 0
    expect(game.states[0].perceivedIdeology[1][3]).toBeCloseTo(2.0);
  });

  it('campaign result is appended to player.campaignResults', () => {
    const game = createMinimalGameState();
    executeCampaign(game, 0, 0, 0);
    expect(game.players[0].campaignResults).toHaveLength(1);
  });

  it('CampaignResult has correct round, stateIndex, attributeIndex', () => {
    const game = createMinimalGameState();
    game.currentRound = 3;
    const result = executeCampaign(game, 0, 1, 5);
    expect(result).not.toBeNull();
    expect(result!.round).toBe(3);
    expect(result!.stateIndex).toBe(1);
    expect(result!.attributeIndex).toBe(5);
  });

  it('second campaign on same (state, attr) in same round succeeds and stacks boost', () => {
    // campaigns.ts has no duplicate check — multiple campaigns allowed
    const game = createMinimalGameState();
    game.players[0].coins = 200;
    game.states[0].perceivedIdeology[0][0] = 2.0;
    executeCampaign(game, 0, 0, 0); // first: 2.0 → 2.5
    executeCampaign(game, 0, 0, 0); // second: 2.5 → 3.0
    expect(game.states[0].perceivedIdeology[0][0]).toBeCloseTo(3.0);
    expect(game.players[0].campaignResults).toHaveLength(2);
  });

  it('only affects the campaigned state, not other states', () => {
    const game = createMinimalGameState();
    game.states[1].perceivedIdeology[0][0] = 2.0;
    executeCampaign(game, 0, 0, 0); // campaign in state 0
    expect(game.states[1].perceivedIdeology[0][0]).toBeCloseTo(2.0); // state 1 unchanged
  });
});
