import { GameState, PollResult, COST_POLL } from './types';
import { canAfford, spendCoins } from './economy';

/**
 * Execute a poll action: reveal expectation, perceived quality, and
 * perceived ideology for a specific state, privately to the requesting player.
 *
 * Returns the poll result or null if the action is invalid.
 */
export function executePoll(
  game: GameState,
  playerIndex: number,
  stateIndex: number,
): PollResult | null {
  if (!canAfford(game, playerIndex, COST_POLL)) return null;
  if (stateIndex < 0 || stateIndex >= game.states.length) return null;

  spendCoins(game, playerIndex, COST_POLL);

  const state = game.states[stateIndex];
  const result: PollResult = {
    round: game.currentRound,
    stateIndex,
    expectation: state.attributes.map((a) => a.expectation),
    perceivedQuality: state.attributes.map((a) => a.perceivedQuality),
    perceivedIdeology: state.perceivedIdeology[playerIndex].slice(),
  };

  game.players[playerIndex].pollResults.push(result);

  return result;
}

/**
 * Check if a player is a governor of a state (free information access).
 */
export function isGovernorOf(
  game: GameState,
  playerIndex: number,
  stateIndex: number,
): boolean {
  const state = game.states[stateIndex];
  const govOffice = state.offices.find((o) => o.type === 'GOVERNOR');
  return govOffice?.partyIndex === playerIndex;
}
