'use client';

import { useGameState, useGameDispatch } from '@/game/store';
import { Sidebar } from './Sidebar';
import { Dashboard } from './Dashboard';
import { PollPanel } from './PollPanel';
import { CampaignPanel } from './CampaignPanel';
import { ElectionResults } from './ElectionResults';
import { Scoreboard } from './Scoreboard';

export function GameBoard() {
  const { game, message } = useGameState();
  const dispatch = useGameDispatch();

  if (!game) return null;

  const isFinished = game.status === 'FINISHED';

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-6">
        {/* Message bar */}
        {message && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
            {message}
          </div>
        )}

        {isFinished ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Game Over!</h2>
            <Scoreboard />
          </div>
        ) : (
          <>
            {/* Phase-specific content */}
            <div className="mb-6">
              <PhaseContent />
            </div>

            {/* Dashboard always visible */}
            <Dashboard />

            {/* End phase button */}
            <div className="mt-6">
              <button
                onClick={() => dispatch({ type: 'END_PHASE' })}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                End {game.currentPhase === 'POLLS' ? 'Polls' : 'Campaign'} Phase
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PhaseContent() {
  const { game } = useGameState();
  if (!game) return null;

  switch (game.currentPhase) {
    case 'POLLS':
      return <PollPanel />;
    case 'CAMPAIGNS':
      return <CampaignPanel />;
    case 'ELECTIONS':
      return <ElectionResults />;
    default:
      return null;
  }
}
