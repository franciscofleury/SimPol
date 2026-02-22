'use client';

import { useGameState, useGameDispatch } from '@/game/store';
import { ATTRIBUTE_LABELS, ATTRIBUTES, COST_POLL } from '@/game/types';

export function PollPanel() {
  const { game, lastPollResult } = useGameState();
  const dispatch = useGameDispatch();

  if (!game) return null;

  const humanPlayer = game.players[0];
  const canAffordPoll = humanPlayer.coins >= COST_POLL;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Polls Phase</h2>
        <span className="text-sm text-gray-500">Cost: {COST_POLL} coins per poll</span>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Purchase polls to reveal voter expectations, perceived quality, and how voters perceive your ideology in a state.
      </p>

      {/* State selection */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
        {game.states.map((state) => (
          <button
            key={state.stateIndex}
            onClick={() => dispatch({ type: 'POLL', stateIndex: state.stateIndex })}
            disabled={!canAffordPoll}
            className={`p-3 rounded-lg border text-left transition-all ${
              canAffordPoll
                ? 'border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                : 'border-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <div className="font-medium text-sm">{state.name}</div>
            <div className="text-xs text-gray-500">{state.size} &middot; {state.deputies} dep.</div>
          </button>
        ))}
      </div>

      {/* Last poll result */}
      {lastPollResult && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">
            Poll Results: {game.states[lastPollResult.stateIndex].name}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="pb-2 pr-4">Attribute</th>
                  <th className="pb-2 pr-4">Expectation</th>
                  <th className="pb-2 pr-4">Perceived Quality</th>
                  <th className="pb-2 pr-4">GAP</th>
                  <th className="pb-2">Your Perceived Ideology</th>
                </tr>
              </thead>
              <tbody>
                {ATTRIBUTES.map((attr, i) => {
                  const gap = lastPollResult.expectation[i] - lastPollResult.perceivedQuality[i];
                  return (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-1.5 pr-4 font-medium">{ATTRIBUTE_LABELS[attr]}</td>
                      <td className="py-1.5 pr-4 font-mono">{lastPollResult.expectation[i].toFixed(1)}</td>
                      <td className="py-1.5 pr-4 font-mono">{lastPollResult.perceivedQuality[i].toFixed(1)}</td>
                      <td className={`py-1.5 pr-4 font-mono ${gap > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {gap > 0 ? '+' : ''}{gap.toFixed(1)}
                      </td>
                      <td className="py-1.5 font-mono">{lastPollResult.perceivedIdeology[i].toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Past poll results */}
      {humanPlayer.pollResults.length > 0 && !lastPollResult && (
        <div className="text-sm text-gray-500">
          You have {humanPlayer.pollResults.length} past poll(s). Purchase a new poll to see fresh data.
        </div>
      )}
    </div>
  );
}
