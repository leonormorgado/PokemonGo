import type { Pokemon } from '../../domain/entities/pokemon.entity.js';
import type { PokemonRepository } from '../../domain/repositories/pokemon.repository.js';
import { NotFoundError, ValidationError } from '../../shared/errors.js';

export class GetPokemonDetailUseCase {
  constructor(private readonly repository: PokemonRepository) {}

  async execute(name: string): Promise<Pokemon> {
    if (!name || name.trim().length === 0) {
      throw new ValidationError('name is required');
    }

    const pokemon = await this.repository.findByName(name);
    if (!pokemon) {
      throw new NotFoundError(`Pokemon "${name}" not found`);
    }
    return pokemon;
  }
}
