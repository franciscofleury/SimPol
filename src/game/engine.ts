import { GameState, Phase, NUM_PARTIES, RoundData } from './types';
import { hasElections } from './calendar';
import { runElections } from './elections';
import { distributeAnnualIncome } from './economy';
import { executeAITurn } from './ai';
import { driftPerceptions } from './perception';

/**
 * Phase order within a round.
 * PROJECTS is included but will be skipped if not implemented.
 */
const PHASE_ORDER: Phase[] = ['POLLS', 'CAMPAIGNS', 'PROJECTS', 'ELECTIONS', 'ROUND_END'];

function nextPhase(current: Phase): Phase {
  const idx = PHASE_ORDER.indexOf(current);
  return PHASE_ORDER[(idx + 1) % PHASE_ORDER.length];
}

/**
 * Check if all players are ready to advance.
 */
export function allPlayersReady(game: GameState): boolean {
  return game.players.every((p) => p.isReady);
}

/**
 * Reset ready status for all players.
 */
function resetReady(game: GameState): void {
  game.players.forEach((p) => (p.isReady = false));
}

/**
 * Execute all AI turns for the current phase.
 */
export function executeAllAITurns(game: GameState): void {
  for (let p = 0; p < NUM_PARTIES; p++) {
    if (game.players[p].isAI) {
      executeAITurn(game, p);
    }
  }
}

/**
 * Advance the game to the next phase.
 * This is the core state machine that drives the game forward.
 *
 * Returns a description of what happened for UI display.
 */
export function advancePhase(game: GameState): string {
  const currentPhase = game.currentPhase;
  let message = '';

  if (currentPhase === 'POLLS') {
    // Move to campaigns
    game.currentPhase = 'CAMPAIGNS';
    resetReady(game);
    message = 'Polls phase complete. Campaign phase begins.';
  } else if (currentPhase === 'CAMPAIGNS') {
    // Skip projects (not implemented) and go to elections or round end
    if (hasElections(game.currentRound)) {
      game.currentPhase = 'ELECTIONS';
      message = 'Campaign phase complete. Elections begin!';
      // Elections are automatic - run them immediately
      const result = runElections(game);
      if (result) {
        const roundData: RoundData = {
          number: game.currentRound,
          electionResult: result,
        };
        // Update or create round data
        const existingRound = game.rounds.find((r) => r.number === game.currentRound);
        if (existingRound) {
          existingRound.electionResult = result;
        } else {
          game.rounds.push(roundData);
        }
      }
      // Auto-advance past elections to round end
      game.currentPhase = 'ROUND_END';
      message += ` Elections complete for year ${game.currentRound}.`;
    } else {
      game.currentPhase = 'ROUND_END';
      message = 'Campaign phase complete. No elections this year.';
      // Ensure round data exists
      if (!game.rounds.find((r) => r.number === game.currentRound)) {
        game.rounds.push({ number: game.currentRound });
      }
    }

    // Round end processing
    distributeAnnualIncome(game);
    driftPerceptions(game);

    // Advance to next round or end game
    if (game.currentRound >= game.maxRounds) {
      game.status = 'FINISHED';
      message += ' Game over!';
    } else {
      game.currentRound++;
      game.currentPhase = 'POLLS';
      resetReady(game);
      message += ` Year ${game.currentRound} begins.`;
    }
  }

  return message;
}

/**
 * Mark a player as ready. If all players ready, advance the phase.
 * Returns a message describing what happened.
 */
export function playerReady(game: GameState, playerIndex: number): string {
  game.players[playerIndex].isReady = true;

  if (allPlayersReady(game)) {
    return advancePhase(game);
  }

  return `Player ${game.players[playerIndex].name} is ready. Waiting for others...`;
}

/**
 * Start a new game: run initial elections (year 0) and set up first round.
 */
export function startGame(game: GameState): string {
  // Year 0 has deputies and senators elections
  // Run them immediately at game start
  const result = runElections(game);
  if (result) {
    game.rounds.push({ number: 0, electionResult: result });
  }

  // Now advance to year 1 for actual gameplay
  game.currentRound = 1;
  game.currentPhase = 'POLLS';
  resetReady(game);

  return 'Game started! Year 0 elections complete. Year 1 begins.';
}
