'use client';

import { useGameState } from '@/game/store';
import { computeScores, computeRealityRanking } from '@/game/scoring';
import { getTotalDeputies } from '@/game/elections';
import { ATTRIBUTE_LABELS, ATTRIBUTES } from '@/game/types';

export function Scoreboard() {
  const { game } = useGameState();
  if (!game) return null;

  const scores = computeScores(game);
  const realityRanking = computeRealityRanking(game);
  const totalDeputies = getTotalDeputies(game);
  const sortedScores = [...scores].sort((a, b) => a.rank - b.rank);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Final Scoreboard</h2>

      {/* Reality ranking */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Country Reality Ranking</h3>
        <p className="text-xs text-gray-500 mb-2">
          Attributes ranked by average real quality across all states
        </p>
        <div className="flex flex-wrap gap-2">
          {realityRanking.map((attrIdx, rank) => (
            <span key={rank} className="text-sm bg-white border border-gray-200 px-2 py-1 rounded">
              #{rank + 1} {ATTRIBUTE_LABELS[ATTRIBUTES[attrIdx]]}
            </span>
          ))}
        </div>
      </div>

      {/* Party scores */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b">
              <th className="pb-2 pr-4">Rank</th>
              <th className="pb-2 pr-4">Party</th>
              <th className="pb-2 pr-4">Score</th>
              <th className="pb-2 pr-4">Deputies</th>
              <th className="pb-2">Ideology Top 3</th>
            </tr>
          </thead>
          <tbody>
            {sortedScores.map((s) => {
              const player = game.players[s.partyIndex];
              return (
                <tr
                  key={s.partyIndex}
                  className={`border-b border-gray-100 ${
                    player.isHuman ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="py-2 pr-4 font-bold text-lg">#{s.rank}</td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: player.color }}
                      />
                      <span className="font-medium">{player.name}</span>
                      {player.isHuman && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">YOU</span>
                      )}
                      {player.isAI && (
                        <span className="text-xs text-gray-400">(AI)</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 pr-4 font-mono font-bold">{s.score.toFixed(3)}</td>
                  <td className="py-2 pr-4 font-mono">{totalDeputies[s.partyIndex]}</td>
                  <td className="py-2">
                    <div className="flex gap-1">
                      {player.ideology.slice(0, 3).map((attrIdx, i) => (
                        <span key={i} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                          {ATTRIBUTE_LABELS[ATTRIBUTES[attrIdx]]}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
