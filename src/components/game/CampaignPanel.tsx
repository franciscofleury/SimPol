'use client';

import { useState } from 'react';
import { useGameState, useGameDispatch } from '@/game/store';
import { ATTRIBUTE_LABELS, ATTRIBUTES, COST_CAMPAIGN } from '@/game/types';

export function CampaignPanel() {
  const { game, scheduledCampaigns } = useGameState();
  const dispatch = useGameDispatch();
  const [selectedState, setSelectedState] = useState<number | null>(null);

  if (!game) return null;

  const humanPlayer = game.players[0];
  const currentRound = game.currentRound;

  // Set of "stateIdx-attrIdx" already campaigned this round
  const campaignedThisRound = new Set(
    humanPlayer.campaignResults
      .filter((r) => r.round === currentRound)
      .map((r) => `${r.stateIndex}-${r.attributeIndex}`),
  );

  // Set of "stateIdx-attrIdx" currently in queue
  const scheduledKeys = new Set(scheduledCampaigns.map((c) => `${c.stateIndex}-${c.attributeIndex}`));

  const canAffordNext = humanPlayer.coins >= COST_CAMPAIGN * (scheduledCampaigns.length + 1);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Campaign Phase</h2>
        <span className="text-sm text-gray-500">
          Cost: {COST_CAMPAIGN} coins/campaign &middot; Total queued: {COST_CAMPAIGN * scheduledCampaigns.length} coins
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Schedule campaigns to run at the end of the phase. Each campaign increases how voters in a state perceive your commitment to a specific attribute.
      </p>

      {/* Step 1: Select state */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">1. Select a State</h3>
        <div className="flex flex-wrap gap-2">
          {game.states.map((state) => (
            <button
              key={state.stateIndex}
              onClick={() => setSelectedState(state.stateIndex)}
              className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                selectedState === state.stateIndex
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {state.name}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Select attribute */}
      {selectedState !== null && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            2. Campaign for an Attribute in {game.states[selectedState].name}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ATTRIBUTES.map((attr, i) => {
              const key = `${selectedState}-${i}`;
              const isQueued = scheduledKeys.has(key);
              const isCampaigned = campaignedThisRound.has(key);
              const isDisabled = isQueued || isCampaigned || (!isQueued && !canAffordNext);
              const currentValue = game.states[selectedState].perceivedIdeology[0][i];

              return (
                <button
                  key={i}
                  onClick={() =>
                    dispatch({ type: 'SCHEDULE_CAMPAIGN', stateIndex: selectedState, attributeIndex: i })
                  }
                  disabled={isDisabled}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    isQueued
                      ? 'border-orange-400 bg-orange-50 cursor-default'
                      : isDisabled
                      ? 'border-gray-100 text-gray-400 cursor-not-allowed'
                      : 'border-gray-200 hover:border-orange-400 hover:bg-orange-50 cursor-pointer'
                  }`}
                >
                  <div className="font-medium text-sm">{ATTRIBUTE_LABELS[attr]}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {isQueued
                      ? 'Scheduled ✓'
                      : isCampaigned
                      ? 'Already campaigned'
                      : `Current: ${currentValue.toFixed(1)}★`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Scheduled queue */}
      {scheduledCampaigns.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Scheduled Campaigns ({scheduledCampaigns.length}) — will run when phase ends
          </h3>
          <ul className="space-y-1">
            {scheduledCampaigns.map((c) => (
              <li
                key={`${c.stateIndex}-${c.attributeIndex}`}
                className="flex items-center justify-between text-sm bg-orange-50 border border-orange-200 rounded px-3 py-2"
              >
                <span>
                  <span className="font-medium">{game.states[c.stateIndex].name}</span>
                  {' — '}{ATTRIBUTE_LABELS[ATTRIBUTES[c.attributeIndex]]}
                </span>
                <button
                  onClick={() =>
                    dispatch({ type: 'CANCEL_CAMPAIGN', stateIndex: c.stateIndex, attributeIndex: c.attributeIndex })
                  }
                  className="text-xs text-red-500 hover:text-red-700 ml-4"
                >
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
