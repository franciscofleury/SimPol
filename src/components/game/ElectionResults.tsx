'use client';

import { useGameState } from '@/game/store';
import { ElectionResult } from '@/game/types';

export function ElectionResults() {
  const { game } = useGameState();
  if (!game) return null;

  // Get the most recent election result
  const latestRound = game.rounds
    .filter((r) => r.electionResult)
    .sort((a, b) => b.number - a.number)[0];

  if (!latestRound?.electionResult) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900">No elections yet</h2>
      </div>
    );
  }

  const result = latestRound.electionResult;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Election Results - Year {result.year}
      </h2>

      <div className="flex flex-wrap gap-2 mb-4">
        {result.types.map((type) => (
          <span key={type} className="text-xs font-medium px-2 py-1 rounded bg-purple-100 text-purple-700">
            {type}
          </span>
        ))}
      </div>

      {/* Deputy results */}
      {result.deputyResults && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Deputy Allocation</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="pb-2 pr-4">State</th>
                  {game.players.map((p) => (
                    <th key={p.partyIndex} className="pb-2 pr-2">
                      <div className="flex items-center gap-1">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="truncate max-w-16">{p.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(result.deputyResults).map(([stateIdx, allocation]) => (
                  <tr key={stateIdx} className="border-b border-gray-100">
                    <td className="py-1.5 pr-4 font-medium">
                      {game.states[Number(stateIdx)].name}
                    </td>
                    {game.players.map((p) => (
                      <td key={p.partyIndex} className="py-1.5 pr-2 font-mono">
                        {allocation[p.partyIndex] || 0}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Totals */}
                <tr className="font-bold">
                  <td className="py-1.5 pr-4">Total</td>
                  {game.players.map((p) => {
                    const total = Object.values(result.deputyResults!).reduce(
                      (sum, alloc) => sum + (alloc[p.partyIndex] || 0),
                      0,
                    );
                    return (
                      <td key={p.partyIndex} className="py-1.5 pr-2 font-mono">
                        {total}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Governor results */}
      {result.governorResults && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Governors Elected</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(result.governorResults).map(([stateIdx, partyIdx]) => {
              const player = game.players[partyIdx];
              return (
                <div key={stateIdx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">
                    {game.states[Number(stateIdx)].name}:
                  </span>
                  <div className="flex items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: player.color }}
                    />
                    <span className="text-sm">{player.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Senator results */}
      {result.senatorResults && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Senators Elected</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(result.senatorResults).map(([stateIdx, winners]) => (
              <div key={stateIdx} className="p-2 bg-gray-50 rounded">
                <div className="text-sm font-medium mb-1">
                  {game.states[Number(stateIdx)].name}
                </div>
                {winners.map((partyIdx, i) => {
                  const player = game.players[partyIdx];
                  return (
                    <div key={i} className="flex items-center gap-1 text-sm">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: player.color }}
                      />
                      <span>{player.name}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
