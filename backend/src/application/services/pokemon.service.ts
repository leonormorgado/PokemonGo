import type { PaginatedResult, Pokemon, PokemonSummary } from '../../domain/entities/pokemon.entity.js';
import type { PokemonRepository } from '../../domain/repositories/pokemon.repository.js';
import { GetPokemonDetailUseCase } from '../use-cases/get-pokemon-detail.use-case.js';
import { CountPokemonByTypeUseCase, ListPokemonUseCase } from '../use-cases/list-pokemon.use-case.js';

// Orchestrates use-cases; the single entry point controllers depend on.
export class PokemonService {
  private readonly listPokemon: ListPokemonUseCase;
  private readonly getPokemonDetail: GetPokemonDetailUseCase;
  private readonly countPokemonByType: CountPokemonByTypeUseCase;

  constructor(repository: PokemonRepository) {
    this.listPokemon = new ListPokemonUseCase(repository);
    this.getPokemonDetail = new GetPokemonDetailUseCase(repository);
    this.countPokemonByType = new CountPokemonByTypeUseCase(repository);
  }

  list(limit: number, offset: number, type?: string, search?: string): Promise<PaginatedResult<PokemonSummary>> {
    return this.listPokemon.execute(limit, offset, type, search);
  }

  getByName(name: string): Promise<Pokemon> {
    return this.getPokemonDetail.execute(name);
  }

  countByType(type: string): Promise<number> {
    return this.countPokemonByType.execute(type);
  }
}
