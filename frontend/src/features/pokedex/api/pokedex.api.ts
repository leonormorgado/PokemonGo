import type { PokemonDetail, PokemonSummary } from '../domain/pokemon.types.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export const pokedexApi = {
  async list(limit: number, offset: number, type?: string, search?: string): Promise<PaginatedResponse<PokemonSummary>> {
    const typeParam = type ? `&type=${encodeURIComponent(type)}` : '';
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    const url = `${API_BASE_URL}/pokemon?limit=${limit}&offset=${offset}${typeParam}${searchParam}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch pokemon list: ${response.status}`);
    const data = await response.json();
    return data;
  },

  async getByName(name: string): Promise<PokemonDetail> {
    const url = `${API_BASE_URL}/pokemon/${name}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch pokemon "${name}": ${response.status}`);
    const data = await response.json();
    return data;
  },

  async getTypeCount(type: string): Promise<number> {
    const url = `${API_BASE_URL}/pokemon/types/${type}/count`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch type count for "${type}": ${response.status}`);
    const data = await response.json();
    return data.total;
  },
};
