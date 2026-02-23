'use client';

import { useGameState, useGameDispatch } from '@/game/store';
import { ATTRIBUTE_LABELS, ATTRIBUTES } from '@/game/types';

export function PollResultsPanel() {
  const { game, lastPollResults } = useGameState();
  const dispatch = useGameDispatch();

  if (!game || lastPollResults.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-blue-200 shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Poll Results</h2>
        <button
          onClick={() => dispatch({ type: 'DISMISS_POLL_RESULTS' })}
          className="text-sm px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          Dismiss
        </button>
      </div>

      <div className="space-y-4">
        {lastPollResults.map((result, idx) => {
          const gap = result.expectation - result.perceivedQuality;
          return (
            <div key={idx} className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                {game.states[result.stateIndex].name}
                {' — '}{ATTRIBUTE_LABELS[ATTRIBUTES[result.attributeIndex]]}
              </h3>

              {/* Quality stats */}
              <div className="flex gap-6 text-sm mb-3">
                <div>
                  <span className="text-gray-500">Expectation: </span>
                  <span className="font-mono">{result.expectation.toFixed(1)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Perceived Quality: </span>
                  <span className="font-mono">{result.perceivedQuality.toFixed(1)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Gap: </span>
                  <span className={`font-mono ${gap > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {gap > 0 ? '+' : ''}{gap.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Party ideology table */}
              <div className="text-sm font-medium text-gray-700 mb-1">Perceived Ideology by Party</div>
              <table className="text-sm w-full">
                <tbody>
                  {game.players.map((p) => (
                    <tr key={p.partyIndex} className="border-t border-gray-100">
                      <td className="py-1 pr-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                          <span>{p.name}</span>
                        </div>
                      </td>
                      <td className="py-1 font-mono text-right">
                        {result.perceivedIdeology[p.partyIndex]?.toFixed(1) ?? '?'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
