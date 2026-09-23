import type { PaginatedResult, Pokemon, PokemonSummary } from '../entities/pokemon.entity.js';

// Port: infrastructure adapters implement this contract.
export interface PokemonRepository {
  list(limit: number, offset: number): Promise<PaginatedResult<PokemonSummary>>;
  findByName(name: string): Promise<Pokemon | null>;
}
