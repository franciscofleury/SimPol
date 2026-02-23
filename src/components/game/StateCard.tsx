'use client';

import { GameStateData, PlayerData, ATTRIBUTE_LABELS, ATTRIBUTES } from '@/game/types';
import { roundToHalf } from '@/game/polls';

type Tab = 'quality' | 'expectation' | 'perception' | 'ideology';

interface StateCardProps {
  state: GameStateData;
  players: PlayerData[];
  activeTab: Tab;
  polledAttributes: Set<number>;  // set of attributeIndex values polled by the human player
}

export function StateCard({ state, players, activeTab, polledAttributes }: StateCardProps) {
  const governor = state.offices.find((o) => o.type === 'GOVERNOR');
  const governorParty = governor?.partyIndex !== null && governor?.partyIndex !== undefined
    ? players[governor.partyIndex]
    : null;

  const senators = state.offices
    .filter((o) => o.type === 'SENATOR_1' || o.type === 'SENATOR_2')
    .map((o) => (o.partyIndex !== null && o.partyIndex !== undefined ? players[o.partyIndex] : null));

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{state.name}</h3>
          <span className="text-xs text-gray-500">
            {state.size} &middot; {state.deputies} deputies
          </span>
        </div>
        <div className="text-right text-xs">
          {governorParty && (
            <div className="flex items-center gap-1 justify-end">
              <span className="text-gray-500">Gov:</span>
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: governorParty.color }}
              />
              <span>{governorParty.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Attributes — tab-aware */}
      <div className="space-y-1.5">
        {activeTab === 'quality' && (
          <>
            {state.attributes.map((attr, i) => {
              const pct = Math.min(100, (attr.realQuality / 8) * 100);
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-24 text-gray-600 truncate">
                    {ATTRIBUTE_LABELS[ATTRIBUTES[i]]}
                  </span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-gray-500 font-mono">
                    {attr.realQuality.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </>
        )}

        {(activeTab === 'expectation' || activeTab === 'perception') && (
          <>
            {state.attributes.map((attr, i) => {
              const val = roundToHalf(activeTab === 'expectation' ? attr.expectation : attr.perceivedQuality);
              const pct = Math.min(100, (val / 8) * 100);
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-24 text-gray-600 truncate">
                    {ATTRIBUTE_LABELS[ATTRIBUTES[i]]}
                  </span>
                  {polledAttributes.has(i) ? (
                    <>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-gray-500 font-mono">
                        {val.toFixed(1)}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden" />
                      <span className="w-8 text-right text-gray-400 font-mono">?</span>
                    </>
                  )}
                </div>
              );
            })}
          </>
        )}

        {activeTab === 'ideology' && (
          <table className="w-full text-xs border-collapse mt-1">
            <thead>
              <tr>
                <th className="text-left py-0.5 pr-2 text-gray-500 font-normal w-24">Attribute</th>
                {players.map((p) => (
                  <th key={p.partyIndex} className="text-center py-0.5 px-1">
                    <div
                      className="w-3 h-3 rounded-full mx-auto"
                      style={{ backgroundColor: p.color }}
                      title={p.name}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ATTRIBUTES.map((attr, attrIdx) => (
                <tr key={attrIdx} className="border-t border-gray-100">
                  <td className="py-0.5 pr-2 text-gray-600 truncate">
                    {ATTRIBUTE_LABELS[attr]}
                  </td>
                  {players.map((p) => (
                    <td key={p.partyIndex} className="text-center py-0.5 px-1 text-gray-700 font-mono">
                      {polledAttributes.has(attrIdx)
                        ? (() => {
                            const v = state.perceivedIdeology[p.partyIndex]?.[attrIdx];
                            return v !== undefined ? roundToHalf(v).toFixed(1) : '?';
                          })()
                        : '?'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Deputy allocation bar */}
      {Object.values(state.deputyAllocation).some((v) => v > 0) && (
        <div className="mt-3">
          <div className="text-xs text-gray-500 mb-1">Deputies</div>
          <div className="flex h-3 rounded-full overflow-hidden">
            {Object.entries(state.deputyAllocation)
              .filter(([, count]) => count > 0)
              .sort(([, a], [, b]) => b - a)
              .map(([partyIdx, count]) => (
                <div
                  key={partyIdx}
                  className="h-full"
                  style={{
                    width: `${(count / state.deputies) * 100}%`,
                    backgroundColor: players[Number(partyIdx)].color,
                  }}
                  title={`${players[Number(partyIdx)].name}: ${count}`}
                />
              ))}
          </div>
        </div>
      )}

      {/* Senators */}
      {senators.some((s) => s !== null) && (
        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
          <span>Senators:</span>
          {senators.map((s, i) =>
            s ? (
              <div key={i} className="flex items-center gap-0.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span>{s.name}</span>
                {i < senators.length - 1 && <span>,</span>}
              </div>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}
