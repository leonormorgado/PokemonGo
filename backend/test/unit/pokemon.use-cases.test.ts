import { describe, expect, it } from 'vitest';
import type { PaginatedResult, Pokemon, PokemonSummary } from '../../src/domain/entities/pokemon.entity.js';
import type { PokemonRepository } from '../../src/domain/repositories/pokemon.repository.js';
import { GetPokemonDetailUseCase } from '../../src/application/use-cases/get-pokemon-detail.use-case.js';
import { ListPokemonUseCase } from '../../src/application/use-cases/list-pokemon.use-case.js';
import { NotFoundError, ValidationError } from '../../src/shared/errors.js';

class InMemoryPokemonRepository implements PokemonRepository {
  constructor(private readonly pokemon: Pokemon[]) {}

  async list(limit: number, offset: number): Promise<PaginatedResult<PokemonSummary>> {
    const items = this.pokemon
      .slice(offset, offset + limit)
      .map(({ id, name, sprite }) => ({ id, name, sprite }));
    return { items, total: this.pokemon.length, limit, offset };
  }

  async findByName(name: string): Promise<Pokemon | null> {
    return this.pokemon.find((p) => p.name === name) ?? null;
  }
}

const samplePokemon: Pokemon = {
  id: 1,
  name: 'bulbasaur',
  height: 7,
  weight: 69,
  types: ['grass', 'poison'],
  sprite: 'https://example.com/1.png',
  stats: { hp: 45, attack: 49, defense: 49, specialAttack: 65, specialDefense: 65, speed: 45 },
};

describe('ListPokemonUseCase', () => {
  const repository = new InMemoryPokemonRepository([samplePokemon]);
  const useCase = new ListPokemonUseCase(repository);

  it('returns a paginated list', async () => {
    const result = await useCase.execute(10, 0);
    expect(result.total).toBe(1);
    expect(result.items[0]?.name).toBe('bulbasaur');
  });

  it('rejects invalid limit', async () => {
    await expect(useCase.execute(0, 0)).rejects.toBeInstanceOf(ValidationError);
    await expect(useCase.execute(201, 0)).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects negative offset', async () => {
    await expect(useCase.execute(10, -1)).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('GetPokemonDetailUseCase', () => {
  const repository = new InMemoryPokemonRepository([samplePokemon]);
  const useCase = new GetPokemonDetailUseCase(repository);

  it('returns pokemon detail by name', async () => {
    const result = await useCase.execute('bulbasaur');
    expect(result.id).toBe(1);
  });

  it('throws NotFoundError when missing', async () => {
    await expect(useCase.execute('missingno')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws ValidationError when name is empty', async () => {
    await expect(useCase.execute('')).rejects.toBeInstanceOf(ValidationError);
  });
});
