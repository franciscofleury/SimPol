'use client';

import { useState } from 'react';
import { GameProvider } from '@/game/store';
import { SetupScreen } from '@/components/game/SetupScreen';
import { GameBoard } from '@/components/game/GameBoard';

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false);

  return (
    <GameProvider>
      <main className="min-h-screen bg-gray-50">
        {!gameStarted ? (
          <SetupScreen onGameCreated={() => setGameStarted(true)} />
        ) : (
          <GameBoard />
        )}
      </main>
    </GameProvider>
  );
}
