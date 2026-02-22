'use client';

import { useGameState } from '@/game/store';
import { StateCard } from './StateCard';

export function Dashboard() {
  const { game } = useGameState();
  if (!game) return null;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Country Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {game.states.map((state) => (
          <StateCard key={state.stateIndex} state={state} players={game.players} />
        ))}
      </div>
    </div>
  );
}
