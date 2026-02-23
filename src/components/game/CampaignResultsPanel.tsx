'use client';

import { useGameState, useGameDispatch } from '@/game/store';
import { ATTRIBUTE_LABELS, ATTRIBUTES } from '@/game/types';

export function CampaignResultsPanel() {
  const { game, lastCampaignResults } = useGameState();
  const dispatch = useGameDispatch();

  if (!game || lastCampaignResults.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-orange-200 shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Campaign Results</h2>
        <button
          onClick={() => dispatch({ type: 'DISMISS_CAMPAIGN_RESULTS' })}
          className="text-sm px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          Dismiss
        </button>
      </div>
      <ul className="space-y-2">
        {lastCampaignResults.map((result, idx) => (
          <li key={idx} className="flex items-center gap-2 text-sm">
            <span className="text-orange-500">+0.5</span>
            <span className="font-medium">{game.states[result.stateIndex].name}</span>
            <span className="text-gray-500">—</span>
            <span>{ATTRIBUTE_LABELS[ATTRIBUTES[result.attributeIndex]]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
