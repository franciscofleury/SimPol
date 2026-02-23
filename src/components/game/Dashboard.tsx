'use client';

import { useState } from 'react';
import { useGameState } from '@/game/store';
import { KnownAttrInfo } from '@/game/types';
import { StateCard } from './StateCard';

type Tab = 'quality' | 'expectation' | 'perception' | 'ideology';

const TABS = [
  { id: 'quality',     label: 'Quality' },
  { id: 'expectation', label: 'Expectation' },
  { id: 'perception',  label: 'Perception' },
  { id: 'ideology',    label: 'Perceived Ideology' },
] as const;

export function Dashboard() {
  const { game } = useGameState();
  const [activeTab, setActiveTab] = useState<Tab>('quality');

  if (!game) return null;

  const knownByState = new Map<number, Map<number, KnownAttrInfo>>();
  for (const k of game.players[0].knownInfo) {
    if (!knownByState.has(k.stateIndex)) {
      knownByState.set(k.stateIndex, new Map());
    }
    knownByState.get(k.stateIndex)!.set(k.attributeIndex, k);
  }

  return (
    <div>
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={
              activeTab === tab.id
                ? 'px-3 py-1.5 rounded-md text-sm font-medium bg-white text-gray-900 shadow-sm'
                : 'px-3 py-1.5 rounded-md text-sm text-gray-600 hover:text-gray-900'
            }
          >
            {tab.label}
          </button>
        ))}
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Country Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {game.states.map((state) => (
          <StateCard
            key={state.stateIndex}
            state={state}
            players={game.players}
            activeTab={activeTab}
            knownAttributes={knownByState.get(state.stateIndex) ?? new Map()}
          />
        ))}
      </div>
    </div>
  );
}
