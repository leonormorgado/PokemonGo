import type { PaginatedResult, Pokemon, PokemonSummary } from '../entities/pokemon.entity.js';

// Port: infrastructure adapters implement this contract.
export interface PokemonRepository {
  list(limit: number, offset: number, type?: string, search?: string): Promise<PaginatedResult<PokemonSummary>>;
  findByName(name: string): Promise<Pokemon | null>;
  countByType(type: string): Promise<number>;
}
