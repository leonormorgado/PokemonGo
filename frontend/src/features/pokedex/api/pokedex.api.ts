import type { PokemonDetail, PokemonSummary } from '../domain/pokemon.types.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export const pokedexApi = {
  async list(limit: number, offset: number): Promise<PaginatedResponse<PokemonSummary>> {
    const response = await fetch(`${API_BASE_URL}/pokemon?limit=${limit}&offset=${offset}`);
    if (!response.ok) throw new Error(`Failed to fetch pokemon list: ${response.status}`);
    return response.json();
  },

  async getByName(name: string): Promise<PokemonDetail> {
    const response = await fetch(`${API_BASE_URL}/pokemon/${name}`);
    if (!response.ok) throw new Error(`Failed to fetch pokemon "${name}": ${response.status}`);
    return response.json();
  },
};
