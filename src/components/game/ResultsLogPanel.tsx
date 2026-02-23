'use client';

import { useGameState, useGameDispatch, type ResultLogEntry } from '@/game/store';
import { ATTRIBUTE_LABELS, ATTRIBUTES, type GameState } from '@/game/types';
import { roundToHalf } from '@/game/polls';

type PollEntry = Extract<ResultLogEntry, { kind: 'poll' }>;
type CampaignEntry = Extract<ResultLogEntry, { kind: 'campaign' }>;

export function ResultsLogPanel() {
  const { game, resultsLog } = useGameState();
  const dispatch = useGameDispatch();

  if (!game) return null;

  // Display newest entries first
  const entries = [...resultsLog].reverse();

  return (
    <aside className="w-80 flex-shrink-0 sticky top-0 h-screen overflow-y-auto border-l border-gray-200 bg-gray-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
        <h2 className="text-sm font-semibold text-gray-900">Results Log</h2>
        {resultsLog.length > 0 && (
          <button
            onClick={() => dispatch({ type: 'CLEAR_RESULTS_LOG' })}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Clear all
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-gray-400 text-center mt-8 px-4">
          No results yet. Poll and campaign results will appear here.
        </p>
      ) : (
        <ul className="flex flex-col gap-2 p-3">
          {entries.map((entry) => (
            <li key={entry.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 text-xs">
              {entry.kind === 'poll' ? (
                <PollLogEntry
                  entry={entry}
                  game={game}
                  onDelete={() => dispatch({ type: 'DELETE_RESULT_LOG_ENTRY', id: entry.id })}
                />
              ) : (
                <CampaignLogEntry
                  entry={entry}
                  game={game}
                  onDelete={() => dispatch({ type: 'DELETE_RESULT_LOG_ENTRY', id: entry.id })}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

function PollLogEntry({
  entry,
  game,
  onDelete,
}: {
  entry: PollEntry;
  game: GameState;
  onDelete: () => void;
}) {
  const { data } = entry;
  const exp = roundToHalf(data.expectation);
  const pq = roundToHalf(data.perceivedQuality);
  const gap = exp - pq;

  return (
    <>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span className="inline-block font-medium bg-blue-100 text-blue-700 rounded px-1.5 py-0.5 mr-1">
            Poll · R{data.round + 1}
          </span>
          <span className="font-medium text-gray-900">{game.states[data.stateIndex].name}</span>
          <span className="text-gray-500"> — {ATTRIBUTE_LABELS[ATTRIBUTES[data.attributeIndex]]}</span>
        </div>
        <button onClick={onDelete} className="text-gray-300 hover:text-red-400 flex-shrink-0 leading-none text-base">
          ×
        </button>
      </div>

      <div className="flex gap-3 text-gray-600 mb-2">
        <span>Exp: <span className="font-mono text-gray-900">{exp.toFixed(1)}</span></span>
        <span>PQ: <span className="font-mono text-gray-900">{pq.toFixed(1)}</span></span>
        <span>Gap: <span className={`font-mono font-medium ${gap > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {gap > 0 ? '+' : ''}{gap.toFixed(1)}
        </span></span>
      </div>

      <div className="text-gray-500 mb-1">Perceived ideology by party:</div>
      <table className="w-full">
        <tbody>
          {game.players.map((p) => (
            <tr key={p.partyIndex} className="border-t border-gray-100">
              <td className="py-0.5 pr-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="text-gray-700 truncate max-w-[120px]">{p.name.split(' — ')[0]}</span>
                </div>
              </td>
              <td className="py-0.5 font-mono text-right text-gray-900">
                {data.perceivedIdeology[p.partyIndex] !== undefined
                  ? roundToHalf(data.perceivedIdeology[p.partyIndex]).toFixed(1)
                  : '?'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function CampaignLogEntry({
  entry,
  game,
  onDelete,
}: {
  entry: CampaignEntry;
  game: GameState;
  onDelete: () => void;
}) {
  const { data } = entry;

  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <span className="inline-block font-medium bg-orange-100 text-orange-700 rounded px-1.5 py-0.5 mr-1">
          Campaign · R{data.round + 1}
        </span>
        <span className="text-orange-600 font-medium">+0.5</span>
        {' '}
        <span className="font-medium text-gray-900">{game.states[data.stateIndex].name}</span>
        <span className="text-gray-500"> — {ATTRIBUTE_LABELS[ATTRIBUTES[data.attributeIndex]]}</span>
      </div>
      <button onClick={onDelete} className="text-gray-300 hover:text-red-400 flex-shrink-0 leading-none text-base">
        ×
      </button>
    </div>
  );
}
