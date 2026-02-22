import { GameState, GameStateData, ElectionResult, ElectionType, NUM_PARTIES } from './types';
import { computeGaps, computeStateVotes } from './voters';
import { getElectionsForYear } from './calendar';

/**
 * D'Hondt proportional seat allocation.
 * Used for deputy elections within each state.
 */
export function dHondt(
  voteShares: Record<number, number>,
  totalSeats: number,
): Record<number, number> {
  const seats: Record<number, number> = {};
  const partyIndices = Object.keys(voteShares).map(Number);
  partyIndices.forEach((p) => (seats[p] = 0));

  for (let i = 0; i < totalSeats; i++) {
    let bestParty = partyIndices[0];
    let bestQuotient = -1;
    for (const p of partyIndices) {
      const quotient = voteShares[p] / (seats[p] + 1);
      if (quotient > bestQuotient) {
        bestQuotient = quotient;
        bestParty = p;
      }
    }
    seats[bestParty]++;
  }

  return seats;
}

/**
 * Plurality: party with highest vote share wins.
 * Ties broken by lowest party index (arbitrary but deterministic).
 */
export function plurality(voteShares: Record<number, number>): number {
  let bestParty = 0;
  let bestShare = -1;
  for (const [p, share] of Object.entries(voteShares)) {
    if (share > bestShare) {
      bestShare = share;
      bestParty = Number(p);
    }
  }
  return bestParty;
}

/**
 * Compute vote shares for a single state based on current game state.
 */
function computeVoteSharesForState(
  state: GameStateData,
): Record<number, number> {
  const expectations = state.attributes.map((a) => a.expectation);
  const perceivedQualities = state.attributes.map((a) => a.perceivedQuality);
  const gaps = computeGaps(expectations, perceivedQualities);
  const result = computeStateVotes(gaps, state.perceivedIdeology);
  return result.voteShares;
}

/**
 * Run all elections scheduled for the current year.
 * Returns the election result and mutates game state (offices, deputy allocations).
 */
export function runElections(game: GameState): ElectionResult | null {
  const event = getElectionsForYear(game.currentRound);
  if (!event) return null;

  const result: ElectionResult = {
    year: game.currentRound,
    types: event.types,
  };

  if (event.types.includes('DEPUTIES')) {
    result.deputyResults = {};
    // Reset deputy allocations
    for (const state of game.states) {
      for (let p = 0; p < NUM_PARTIES; p++) {
        state.deputyAllocation[p] = 0;
      }
    }
    for (const state of game.states) {
      const voteShares = computeVoteSharesForState(state);
      const seats = dHondt(voteShares, state.deputies);
      result.deputyResults[state.stateIndex] = seats;
      // Update state deputy allocations
      for (let p = 0; p < NUM_PARTIES; p++) {
        state.deputyAllocation[p] = seats[p] || 0;
      }
    }
    game.firstDeputyElectionDone = true;
  }

  if (event.types.includes('GOVERNORS')) {
    result.governorResults = {};
    for (const state of game.states) {
      const voteShares = computeVoteSharesForState(state);
      const winner = plurality(voteShares);
      result.governorResults[state.stateIndex] = winner;
      // Update governor office
      const govOffice = state.offices.find((o) => o.type === 'GOVERNOR');
      if (govOffice) {
        govOffice.partyIndex = winner;
        govOffice.electedYear = game.currentRound;
        govOffice.expiresYear = game.currentRound + 4;
      }
    }
  }

  if (event.types.includes('SENATORS')) {
    result.senatorResults = {};
    for (const state of game.states) {
      const voteShares = computeVoteSharesForState(state);
      // Two senator seats: top 2 vote-getters
      const sorted = Object.entries(voteShares)
        .sort((a, b) => b[1] - a[1])
        .map(([p]) => Number(p));
      const winners = [sorted[0], sorted[1]];
      result.senatorResults[state.stateIndex] = winners;

      // Update senator offices
      const sen1 = state.offices.find((o) => o.type === 'SENATOR_1');
      const sen2 = state.offices.find((o) => o.type === 'SENATOR_2');
      if (sen1) {
        sen1.partyIndex = winners[0];
        sen1.electedYear = game.currentRound;
        sen1.expiresYear = game.currentRound + 6;
      }
      if (sen2) {
        sen2.partyIndex = winners[1];
        sen2.electedYear = game.currentRound;
        sen2.expiresYear = game.currentRound + 6;
      }
    }
  }

  return result;
}

/**
 * Get total deputies for each party across all states.
 */
export function getTotalDeputies(game: GameState): Record<number, number> {
  const totals: Record<number, number> = {};
  for (let p = 0; p < NUM_PARTIES; p++) {
    totals[p] = 0;
  }
  for (const state of game.states) {
    for (let p = 0; p < NUM_PARTIES; p++) {
      totals[p] += state.deputyAllocation[p] || 0;
    }
  }
  return totals;
}
