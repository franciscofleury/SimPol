'use client';

import { useState } from 'react';
import { useGameState, useGameDispatch } from '@/game/store';
import { ATTRIBUTE_LABELS, ATTRIBUTES, COST_CAMPAIGN } from '@/game/types';

export function CampaignPanel() {
  const { game } = useGameState();
  const dispatch = useGameDispatch();
  const [selectedState, setSelectedState] = useState<number | null>(null);

  if (!game) return null;

  const humanPlayer = game.players[0];
  const canAffordCampaign = humanPlayer.coins >= COST_CAMPAIGN;

  const handleCampaign = (attributeIndex: number) => {
    if (selectedState === null) return;
    dispatch({
      type: 'CAMPAIGN',
      stateIndex: selectedState,
      attributeIndex,
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Campaign Phase</h2>
        <span className="text-sm text-gray-500">Cost: {COST_CAMPAIGN} coins per campaign</span>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Run campaigns to increase how voters in a state perceive your commitment to a specific attribute.
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
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
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
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            2. Campaign for an Attribute in {game.states[selectedState].name}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ATTRIBUTES.map((attr, i) => {
              const currentValue =
                game.states[selectedState].perceivedIdeology[0][i];
              return (
                <button
                  key={i}
                  onClick={() => handleCampaign(i)}
                  disabled={!canAffordCampaign}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    canAffordCampaign
                      ? 'border-gray-200 hover:border-orange-400 hover:bg-orange-50'
                      : 'border-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="font-medium text-sm">{ATTRIBUTE_LABELS[attr]}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Current: {currentValue.toFixed(1)}★
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
