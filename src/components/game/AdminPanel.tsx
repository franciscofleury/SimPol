'use client';

import { useGameState } from '@/game/store';
import { ATTRIBUTES, ATTRIBUTE_LABELS, NUM_PARTIES } from '@/game/types';

interface AdminPanelProps {
  onClose: () => void;
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const state = useGameState();
  const { game, message, lastPollResults, scheduledPolls } = state;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto">
      <div className="relative bg-gray-900 text-gray-100 w-full max-w-5xl my-8 mx-4 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 sticky top-0 bg-gray-900 rounded-t-xl z-10">
          <h2 className="text-lg font-bold text-white">Admin / Debug Panel</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none px-2"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Section 1: Game Info */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2">Game Info</h3>
            <table className="w-full text-sm border-collapse">
              <tbody>
                {[
                  ['status', game?.status ?? 'null'],
                  ['currentRound', game?.currentRound ?? 'null'],
                  ['maxRounds', game?.maxRounds ?? 'null'],
                  ['currentPhase', game?.currentPhase ?? 'null'],
                  ['firstDeputyElectionDone', String(game?.firstDeputyElectionDone ?? 'null')],
                  ['message', message || '(empty)'],
                  ['scheduledPolls', scheduledPolls.length > 0 ? JSON.stringify(scheduledPolls) : '[]'],
                  ['lastPollResults', lastPollResults.length > 0 ? `${lastPollResults.length} result(s)` : '[]'],
                ].map(([key, value]) => (
                  <tr key={key} className="border-b border-gray-800">
                    <td className="py-1 pr-4 text-gray-400 font-mono w-48 align-top">{key}</td>
                    <td className="py-1 text-gray-100 font-mono break-all">{String(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Section 2: Players */}
          {game && (
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2">Players</h3>
              <div className="space-y-2">
                {game.players.map((player) => (
                  <details key={player.partyIndex} className="bg-gray-800 rounded-lg">
                    <summary className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-200 flex items-center gap-3">
                      <span
                        className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: player.color }}
                      />
                      <span>{player.name}</span>
                      <span className="text-gray-500 text-xs ml-auto">
                        Party {player.partyIndex} · {player.isHuman ? 'Human' : 'AI'} · {player.coins} coins
                      </span>
                    </summary>
                    <div className="px-4 pb-3 pt-1 text-xs space-y-3">
                      {/* Basic fields */}
                      <table className="w-full border-collapse">
                        <tbody>
                          {[
                            ['name', player.name],
                            ['color', player.color],
                            ['partyIndex', player.partyIndex],
                            ['isHuman', String(player.isHuman)],
                            ['isAI', String(player.isAI)],
                            ['isReady', String(player.isReady)],
                            ['coins', player.coins],
                          ].map(([k, v]) => (
                            <tr key={String(k)} className="border-b border-gray-700">
                              <td className="py-0.5 pr-3 text-gray-400 font-mono w-32">{k}</td>
                              <td className="py-0.5 text-gray-100 font-mono">{String(v)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Ideology */}
                      <div>
                        <p className="text-gray-400 mb-1 font-semibold">ideology (rank → attribute)</p>
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-gray-700">
                              <th className="text-left py-0.5 pr-3 text-gray-500 font-mono w-12">Rank</th>
                              <th className="text-left py-0.5 text-gray-500 font-mono">Attribute</th>
                              <th className="text-left py-0.5 text-gray-500 font-mono">Index</th>
                            </tr>
                          </thead>
                          <tbody>
                            {player.ideology.map((attrIdx, rank) => (
                              <tr key={rank} className="border-b border-gray-700">
                                <td className="py-0.5 pr-3 text-gray-400 font-mono">{rank + 1}</td>
                                <td className="py-0.5 text-gray-100 font-mono">
                                  {ATTRIBUTE_LABELS[ATTRIBUTES[attrIdx]]}
                                </td>
                                <td className="py-0.5 text-gray-500 font-mono">{attrIdx}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Poll results */}
                      <div>
                        <p className="text-gray-400 mb-1 font-semibold">
                          pollResults ({player.pollResults.length} entries)
                        </p>
                        {player.pollResults.length === 0 ? (
                          <p className="text-gray-500 italic">none</p>
                        ) : (
                          <pre className="text-xs bg-gray-900 rounded p-2 overflow-x-auto text-gray-300 whitespace-pre-wrap">
                            {JSON.stringify(player.pollResults, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* Section 3: States */}
          {game && (
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2">States</h3>
              <div className="space-y-2">
                {game.states.map((st) => (
                  <details key={st.stateIndex} className="bg-gray-800 rounded-lg">
                    <summary className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-200 flex items-center gap-3">
                      <span>{st.name}</span>
                      <span className="text-gray-500 text-xs ml-auto">
                        {st.size} · {st.deputies} deputies
                      </span>
                    </summary>
                    <div className="px-4 pb-3 pt-1 text-xs space-y-4">
                      {/* Basic */}
                      <table className="w-full border-collapse">
                        <tbody>
                          {[
                            ['name', st.name],
                            ['stateIndex', st.stateIndex],
                            ['size', st.size],
                            ['deputies', st.deputies],
                          ].map(([k, v]) => (
                            <tr key={String(k)} className="border-b border-gray-700">
                              <td className="py-0.5 pr-3 text-gray-400 font-mono w-32">{k}</td>
                              <td className="py-0.5 text-gray-100 font-mono">{String(v)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Attributes */}
                      <div>
                        <p className="text-gray-400 mb-1 font-semibold">attributes</p>
                        <table className="w-full border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-gray-700">
                              <th className="text-left py-0.5 pr-2 text-gray-500 font-mono">Attribute</th>
                              <th className="text-right py-0.5 pr-2 text-gray-500 font-mono">realQuality</th>
                              <th className="text-right py-0.5 pr-2 text-gray-500 font-mono">perceivedQuality</th>
                              <th className="text-right py-0.5 text-gray-500 font-mono">expectation</th>
                            </tr>
                          </thead>
                          <tbody>
                            {st.attributes.map((attr, i) => (
                              <tr key={i} className="border-b border-gray-700">
                                <td className="py-0.5 pr-2 text-gray-300 font-mono">
                                  {ATTRIBUTE_LABELS[ATTRIBUTES[i]]}
                                </td>
                                <td className="py-0.5 pr-2 text-right text-gray-100 font-mono">
                                  {attr.realQuality.toFixed(2)}
                                </td>
                                <td className="py-0.5 pr-2 text-right text-gray-100 font-mono">
                                  {attr.perceivedQuality.toFixed(2)}
                                </td>
                                <td className="py-0.5 text-right text-gray-100 font-mono">
                                  {attr.expectation.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Perceived Ideology */}
                      <div>
                        <p className="text-gray-400 mb-1 font-semibold">perceivedIdeology</p>
                        <table className="w-full border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-gray-700">
                              <th className="text-left py-0.5 pr-2 text-gray-500 font-mono">Attribute</th>
                              {Array.from({ length: NUM_PARTIES }, (_, i) => (
                                <th key={i} className="text-right py-0.5 pr-1 text-gray-500 font-mono">
                                  P{i}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {ATTRIBUTES.map((attr, attrIdx) => (
                              <tr key={attrIdx} className="border-b border-gray-700">
                                <td className="py-0.5 pr-2 text-gray-300 font-mono">
                                  {ATTRIBUTE_LABELS[attr]}
                                </td>
                                {Array.from({ length: NUM_PARTIES }, (_, partyIdx) => (
                                  <td
                                    key={partyIdx}
                                    className="py-0.5 pr-1 text-right text-gray-100 font-mono"
                                  >
                                    {st.perceivedIdeology[partyIdx]?.[attrIdx]?.toFixed(1) ?? '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Offices */}
                      <div>
                        <p className="text-gray-400 mb-1 font-semibold">offices</p>
                        <table className="w-full border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-gray-700">
                              <th className="text-left py-0.5 pr-2 text-gray-500 font-mono">type</th>
                              <th className="text-right py-0.5 pr-2 text-gray-500 font-mono">partyIndex</th>
                              <th className="text-right py-0.5 pr-2 text-gray-500 font-mono">electedYear</th>
                              <th className="text-right py-0.5 text-gray-500 font-mono">expiresYear</th>
                            </tr>
                          </thead>
                          <tbody>
                            {st.offices.map((office, i) => (
                              <tr key={i} className="border-b border-gray-700">
                                <td className="py-0.5 pr-2 text-gray-300 font-mono">{office.type}</td>
                                <td className="py-0.5 pr-2 text-right text-gray-100 font-mono">
                                  {office.partyIndex ?? 'null'}
                                </td>
                                <td className="py-0.5 pr-2 text-right text-gray-100 font-mono">
                                  {office.electedYear ?? 'null'}
                                </td>
                                <td className="py-0.5 text-right text-gray-100 font-mono">
                                  {office.expiresYear ?? 'null'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Deputy Allocation */}
                      <div>
                        <p className="text-gray-400 mb-1 font-semibold">deputyAllocation</p>
                        <table className="w-full border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-gray-700">
                              <th className="text-left py-0.5 pr-3 text-gray-500 font-mono">partyIndex</th>
                              <th className="text-right py-0.5 text-gray-500 font-mono">count</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(st.deputyAllocation).map(([partyIdx, count]) => (
                              <tr key={partyIdx} className="border-b border-gray-700">
                                <td className="py-0.5 pr-3 text-gray-300 font-mono">{partyIdx}</td>
                                <td className="py-0.5 text-right text-gray-100 font-mono">{count}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* Section 4: Rounds History */}
          {game && (
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Rounds History ({game.rounds.length})
              </h3>
              {game.rounds.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No rounds completed yet.</p>
              ) : (
                <div className="space-y-2">
                  {game.rounds.map((round) => (
                    <details key={round.number} className="bg-gray-800 rounded-lg">
                      <summary className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-200">
                        Round {round.number}
                        {round.electionResult ? ` · Election (${round.electionResult.types.join(', ')})` : ''}
                      </summary>
                      <div className="px-4 pb-3 pt-1">
                        <pre className="text-xs bg-gray-900 rounded p-2 overflow-x-auto text-gray-300 whitespace-pre-wrap">
                          {JSON.stringify(round, null, 2)}
                        </pre>
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
