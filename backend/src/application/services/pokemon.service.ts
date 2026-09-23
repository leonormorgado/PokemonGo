import type { PaginatedResult, Pokemon, PokemonSummary } from '../../domain/entities/pokemon.entity.js';
import type { PokemonRepository } from '../../domain/repositories/pokemon.repository.js';
import { GetPokemonDetailUseCase } from '../use-cases/get-pokemon-detail.use-case.js';
import { ListPokemonUseCase } from '../use-cases/list-pokemon.use-case.js';

// Orchestrates use-cases; the single entry point controllers depend on.
export class PokemonService {
  private readonly listPokemon: ListPokemonUseCase;
  private readonly getPokemonDetail: GetPokemonDetailUseCase;

  constructor(repository: PokemonRepository) {
    this.listPokemon = new ListPokemonUseCase(repository);
    this.getPokemonDetail = new GetPokemonDetailUseCase(repository);
  }

  list(limit: number, offset: number): Promise<PaginatedResult<PokemonSummary>> {
    return this.listPokemon.execute(limit, offset);
  }

  getByName(name: string): Promise<Pokemon> {
    return this.getPokemonDetail.execute(name);
  }
}
