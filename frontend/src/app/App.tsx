import { useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient } from '../shared/lib/query-client.js';
import { createIndexedDbPersister } from '../shared/lib/indexed-db-persister.js';
import { TopBar } from '../shared/components/TopBar.js';
import { PokedexDashboard } from '../features/pokedex/components/PokedexDashboard.js';
import { MyDeckPage } from '../features/pokedex/components/MyDeckPage.js';
import { SharedDeckPage } from '../features/pokedex/components/SharedDeckPage.js';
import { SharedPokemonPage } from '../features/pokedex/components/SharedPokemonPage.js';

export function App() {
  const persister = useMemo(() => createIndexedDbPersister(), []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 * 7 }}
    >
      <div className="min-h-screen bg-[#F9F6F0] font-mono text-[#241F1A] selection:bg-[#C98A4D] selection:text-[#241F1A]">
        <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
          <TopBar />
          <main className="mt-4">
            <Routes>
              <Route path="/" element={<PokedexDashboard />} />
              <Route path="/pokemon/:id" element={<PokedexDashboard />} />
              <Route path="/deck" element={<MyDeckPage />} />
              <Route path="/deck/:key" element={<SharedDeckPage />} />
              <Route path="/share/pokemon/:id" element={<SharedPokemonPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </PersistQueryClientProvider>
  );
}
