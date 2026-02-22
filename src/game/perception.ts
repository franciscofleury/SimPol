import { GameState } from './types';

/**
 * Natural drift of voter perceptions each round.
 * Perceived quality slowly drifts toward reality.
 * Expectations drift slightly (voters' desires change over time).
 */
export function driftPerceptions(game: GameState): void {
  const DRIFT_RATE = 0.1; // perceived quality moves 10% toward reality each round
  const EXPECTATION_NOISE = 0.2; // random expectation fluctuation

  for (const state of game.states) {
    for (const attr of state.attributes) {
      // Perceived quality drifts toward real quality
      const diff = attr.realQuality - attr.perceivedQuality;
      attr.perceivedQuality += diff * DRIFT_RATE;

      // Expectations fluctuate slightly
      attr.expectation += (Math.random() - 0.5) * EXPECTATION_NOISE;
      // Keep expectation reasonable (at least 0, and not wildly above reality)
      attr.expectation = Math.max(0, attr.expectation);
    }
  }
}
