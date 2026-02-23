'use client';

import { useState } from 'react';
import { useGameState, useGameDispatch } from '@/game/store';
import { Sidebar } from './Sidebar';
import { Dashboard } from './Dashboard';
import { PollPanel } from './PollPanel';
import { CampaignPanel } from './CampaignPanel';
import { ElectionResults } from './ElectionResults';
import { Scoreboard } from './Scoreboard';
import { AdminPanel } from './AdminPanel';
import { PollResultsPanel } from './PollResultsPanel';

export function GameBoard() {
  const { game, message } = useGameState();
  const dispatch = useGameDispatch();
  const [showAdmin, setShowAdmin] = useState(false);

  if (!game) return null;

  const isFinished = game.status === 'FINISHED';

  return (
    <div className="flex min-h-screen">
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
      <Sidebar />
      <div className="flex-1 p-6">
        {/* Message bar + Admin button */}
        <div className="mb-4 flex items-start gap-3">
          {message && (
            <div className="flex-1 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
              {message}
            </div>
          )}
          <button
            onClick={() => setShowAdmin(true)}
            className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 flex-shrink-0 ml-auto"
          >
            Admin
          </button>
        </div>

        {isFinished ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Game Over!</h2>
            <Scoreboard />
          </div>
        ) : (
          <>
            {/* Poll results (shown after Poll phase ends, until dismissed) */}
            <PollResultsPanel />

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
