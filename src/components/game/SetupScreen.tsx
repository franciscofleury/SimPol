'use client';

import { useState } from 'react';
import { IDEOLOGY_PRESETS, ATTRIBUTE_LABELS, ATTRIBUTES, RANK_TO_STARS } from '@/game/types';
import { useGameDispatch } from '@/game/store';

interface SetupScreenProps {
  onGameCreated: () => void;
}

export function SetupScreen({ onGameCreated }: SetupScreenProps) {
  const dispatch = useGameDispatch();
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [maxRounds, setMaxRounds] = useState(12);

  const handleStart = () => {
    if (selectedPreset === null) return;
    dispatch({ type: 'NEW_GAME', presetIndex: selectedPreset, maxRounds });
    dispatch({ type: 'START_GAME' });
    onGameCreated();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">SimPol</h1>
        <p className="text-lg text-gray-600">Strategic Political Simulator</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose Your Party Ideology</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {IDEOLOGY_PRESETS.map((preset, index) => (
            <button
              key={index}
              onClick={() => setSelectedPreset(index)}
              className={`text-left p-4 rounded-lg border-2 transition-all ${
                selectedPreset === index
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: preset.color }}
                />
                <span className="font-semibold text-gray-900">{preset.name}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{preset.description}</p>
              <div className="flex flex-wrap gap-1">
                {preset.ideology.slice(0, 3).map((attrIdx, rank) => (
                  <span
                    key={rank}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                  >
                    #{rank + 1} {ATTRIBUTE_LABELS[ATTRIBUTES[attrIdx]]}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Game Length</h2>
        <div className="flex gap-3">
          {[4, 8, 12].map((years) => (
            <button
              key={years}
              onClick={() => setMaxRounds(years)}
              className={`px-6 py-2 rounded-lg border-2 font-medium transition-all ${
                maxRounds === years
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              {years} Years
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={selectedPreset === null}
        className={`w-full py-3 rounded-lg font-semibold text-lg transition-all ${
          selectedPreset !== null
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        Start Game
      </button>
    </div>
  );
}
