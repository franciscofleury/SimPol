'use client';

import { useGameState } from '@/game/store';
import { ATTRIBUTE_LABELS, ATTRIBUTES, RANK_TO_STARS } from '@/game/types';
import { computeScores } from '@/game/scoring';
import { getTotalDeputies } from '@/game/elections';

export function Sidebar() {
  const { game } = useGameState();
  if (!game) return null;

  const humanPlayer = game.players[0];
  const scores = computeScores(game);
  const totalDeputies = getTotalDeputies(game);

  return (
    <div className="w-72 bg-white border-r border-gray-200 p-4 flex flex-col gap-4 min-h-screen">
      {/* Game Info */}
      <div className="pb-3 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">SimPol</h2>
        <div className="text-sm text-gray-600 mt-1">
          Year {game.currentRound} / {game.maxRounds}
        </div>
        <div className="mt-1">
          <span className="text-xs font-medium px-2 py-1 rounded bg-blue-100 text-blue-700">
            {game.currentPhase}
          </span>
        </div>
      </div>

      {/* Your Party */}
      <div className="pb-3 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: humanPlayer.color }}
          />
          <h3 className="font-semibold text-gray-900">{humanPlayer.name}</h3>
        </div>
        <div className="text-sm text-gray-700 mb-2">
          Budget: <span className="font-bold">{humanPlayer.coins}</span> coins
        </div>
        <div className="text-sm text-gray-700 mb-2">
          Deputies: <span className="font-bold">{totalDeputies[0] || 0}</span>
        </div>
        <div className="text-xs text-gray-500">
          <div className="font-medium mb-1">Ideology Priority:</div>
          {humanPlayer.ideology.map((attrIdx, rank) => (
            <div key={rank} className="flex justify-between">
              <span>#{rank + 1} {ATTRIBUTE_LABELS[ATTRIBUTES[attrIdx]]}</span>
              <span className="text-gray-400">{RANK_TO_STARS[rank + 1]}★</span>
            </div>
          ))}
        </div>
      </div>

      {/* All Parties Summary */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-2 text-sm">All Parties</h3>
        <div className="space-y-1">
          {game.players.map((player) => {
            const score = scores.find((s) => s.partyIndex === player.partyIndex);
            return (
              <div
                key={player.partyIndex}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: player.color }}
                  />
                  <span className={player.isHuman ? 'font-bold' : ''}>
                    {player.name}
                  </span>
                  {player.isAI && (
                    <span className="text-gray-400">(AI)</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">{totalDeputies[player.partyIndex] || 0}d</span>
                  <span className="text-gray-500">{player.coins}c</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scores */}
      <div className="mt-auto pt-3 border-t border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-2 text-sm">Scores</h3>
        <div className="space-y-1">
          {scores
            .slice()
            .sort((a, b) => a.rank - b.rank)
            .map((s) => {
              const player = game.players[s.partyIndex];
              return (
                <div key={s.partyIndex} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400 w-4">#{s.rank}</span>
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: player.color }}
                    />
                    <span>{player.name}</span>
                  </div>
                  <span className="font-mono">{s.score.toFixed(3)}</span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
