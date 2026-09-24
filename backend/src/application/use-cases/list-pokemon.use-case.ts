import type { PaginatedResult, PokemonSummary } from '../../domain/entities/pokemon.entity.js';
import type { PokemonRepository } from '../../domain/repositories/pokemon.repository.js';
import { ValidationError } from '../../shared/errors.js';

export class ListPokemonUseCase {
  constructor(private readonly repository: PokemonRepository) {}

  async execute(limit: number, offset: number, type?: string, search?: string): Promise<PaginatedResult<PokemonSummary>> {
    if (limit <= 0 || limit > 200) {
      throw new ValidationError('limit must be between 1 and 200');
    }
    if (offset < 0) {
      throw new ValidationError('offset must be >= 0');
    }
    return this.repository.list(limit, offset, type, search);
  }
}

export class CountPokemonByTypeUseCase {
  constructor(private readonly repository: PokemonRepository) {}

  async execute(type: string): Promise<number> {
    if (!type) {
      throw new ValidationError('type is required');
    }
    return this.repository.countByType(type);
  }
}
