import { GameState, PollResult, COST_POLL, NUM_ATTRIBUTES } from './types';
import { canAfford, spendCoins } from './economy';

/** Round a value to the nearest 0.5 multiple. Used to limit poll result precision. */
export function roundToHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

/**
 * Execute a poll action: reveal expectation, perceived quality, and all parties'
 * perceived ideology for a single attribute in a specific state.
 *
 * Each (state, attribute) pair can be polled once per round.
 * Returns the poll result or null if the action is invalid.
 */
export function executePoll(
  game: GameState,
  playerIndex: number,
  stateIndex: number,
  attributeIndex: number,
): PollResult | null {
  if (!canAfford(game, playerIndex, COST_POLL)) return null;
  if (stateIndex < 0 || stateIndex >= game.states.length) return null;
  if (attributeIndex < 0 || attributeIndex >= NUM_ATTRIBUTES) return null;

  // Block duplicate polls for the same (state, attribute) pair in the same round
  const alreadyPolled = game.players[playerIndex].pollResults.some(
    (r) =>
      r.stateIndex === stateIndex &&
      r.attributeIndex === attributeIndex &&
      r.round === game.currentRound,
  );
  if (alreadyPolled) return null;

  spendCoins(game, playerIndex, COST_POLL);

  const state = game.states[stateIndex];
  const result: PollResult = {
    round: game.currentRound,
    stateIndex,
    attributeIndex,
    expectation: state.attributes[attributeIndex].expectation,
    perceivedQuality: state.attributes[attributeIndex].perceivedQuality,
    perceivedIdeology: game.players.map((_, pi) => state.perceivedIdeology[pi][attributeIndex]),
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
