'use client';

import { useState } from 'react';
import { useGameState, useGameDispatch } from '@/game/store';
import { ATTRIBUTE_LABELS, ATTRIBUTES, COST_POLL } from '@/game/types';

export function PollPanel() {
  const { game, scheduledPolls } = useGameState();
  const dispatch = useGameDispatch();
  const [selectedState, setSelectedState] = useState<number | null>(null);

  if (!game) return null;

  const humanPlayer = game.players[0];
  const currentRound = game.currentRound;

  // Set of "stateIdx-attrIdx" already polled this round
  const polledThisRound = new Set(
    humanPlayer.pollResults
      .filter((r) => r.round === currentRound)
      .map((r) => `${r.stateIndex}-${r.attributeIndex}`),
  );

  // Set of "stateIdx-attrIdx" currently in queue
  const queuedKeys = new Set(scheduledPolls.map((p) => `${p.stateIndex}-${p.attributeIndex}`));

  const canAffordNext = humanPlayer.coins >= COST_POLL * (scheduledPolls.length + 1);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Polls Phase</h2>
        <span className="text-sm text-gray-500">
          Cost: {COST_POLL} coins/poll &middot; Total queued: {COST_POLL * scheduledPolls.length} coins
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Schedule polls to run at the end of the phase. Results reveal voter expectations, perceived quality, and all parties&apos; perceived ideology for the selected attribute.
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
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            2. Select an Attribute to Poll in {game.states[selectedState].name}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ATTRIBUTES.map((attr, i) => {
              const key = `${selectedState}-${i}`;
              const isQueued = queuedKeys.has(key);
              const isPolled = polledThisRound.has(key);
              const isDisabled = isQueued || isPolled || (!isQueued && !canAffordNext);

              return (
                <button
                  key={i}
                  onClick={() =>
                    dispatch({ type: 'SCHEDULE_POLL', stateIndex: selectedState, attributeIndex: i })
                  }
                  disabled={isDisabled}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    isQueued
                      ? 'border-blue-400 bg-blue-50 cursor-default'
                      : isDisabled
                      ? 'border-gray-100 text-gray-400 cursor-not-allowed'
                      : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                  }`}
                >
                  <div className="font-medium text-sm">{ATTRIBUTE_LABELS[attr]}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {isQueued ? 'Scheduled ✓' : isPolled ? 'Already polled' : ''}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Scheduled queue */}
      {scheduledPolls.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Scheduled Polls ({scheduledPolls.length}) — will run when phase ends
          </h3>
          <ul className="space-y-1">
            {scheduledPolls.map((p) => (
              <li
                key={`${p.stateIndex}-${p.attributeIndex}`}
                className="flex items-center justify-between text-sm bg-blue-50 border border-blue-200 rounded px-3 py-2"
              >
                <span>
                  <span className="font-medium">{game.states[p.stateIndex].name}</span>
                  {' — '}{ATTRIBUTE_LABELS[ATTRIBUTES[p.attributeIndex]]}
                </span>
                <button
                  onClick={() =>
                    dispatch({ type: 'CANCEL_POLL', stateIndex: p.stateIndex, attributeIndex: p.attributeIndex })
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
