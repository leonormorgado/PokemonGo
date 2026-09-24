import type { PokemonSummary } from '../domain/pokemon.types.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

export interface SharedDeck {
  key: string;
  title: string;
  pokemon: PokemonSummary[];
}

export const deckShareApi = {
  async create(title: string, pokemonIds: number[]): Promise<SharedDeck> {
    const response = await fetch(`${API_BASE_URL}/decks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, pokemonIds }),
    });
    if (!response.ok) throw new Error('Could not create the shared deck');
    return response.json();
  },
  async get(key: string): Promise<SharedDeck> {
    const response = await fetch(`${API_BASE_URL}/decks/${encodeURIComponent(key)}`);
    if (!response.ok)
      throw new Error(
        response.status === 404 ? 'Shared deck not found' : 'Could not load the shared deck',
      );
    return response.json();
  },
};
