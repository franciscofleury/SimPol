'use client';

import { useState } from 'react';
import { useGameState, useGameDispatch } from '@/game/store';
import { ATTRIBUTE_LABELS, ATTRIBUTES, COST_POLL } from '@/game/types';

export function PollPanel() {
  const { game, scheduledPolls } = useGameState();
  const dispatch = useGameDispatch();
  const [selectedAttrIndex, setSelectedAttrIndex] = useState(0);

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

      {/* Attribute selector */}
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm font-medium text-gray-700">Attribute:</label>
        <select
          value={selectedAttrIndex}
          onChange={(e) => setSelectedAttrIndex(Number(e.target.value))}
          className="border border-gray-300 rounded-md text-sm px-2 py-1.5"
        >
          {ATTRIBUTES.map((attr, i) => (
            <option key={i} value={i}>{ATTRIBUTE_LABELS[attr]}</option>
          ))}
        </select>
      </div>

      {/* State grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
        {game.states.map((state) => {
          const key = `${state.stateIndex}-${selectedAttrIndex}`;
          const isQueued = queuedKeys.has(key);
          const isPolled = polledThisRound.has(key);
          const isDisabled = isPolled || isQueued || (!isQueued && !canAffordNext);

          return (
            <button
              key={state.stateIndex}
              onClick={() =>
                dispatch({ type: 'SCHEDULE_POLL', stateIndex: state.stateIndex, attributeIndex: selectedAttrIndex })
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
              <div className="font-medium text-sm">{state.name}</div>
              <div className="text-xs text-gray-500">
                {isQueued ? 'Scheduled ✓' : isPolled ? 'Already polled' : `${state.size} · ${state.deputies} dep.`}
              </div>
            </button>
          );
        })}
      </div>

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
