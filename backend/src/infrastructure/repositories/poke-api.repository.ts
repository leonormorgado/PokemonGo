import type { PaginatedResult, Pokemon, PokemonSummary } from '../../domain/entities/pokemon.entity.js';
import type { PokemonRepository } from '../../domain/repositories/pokemon.repository.js';
import type { HttpClient } from '../http-clients/http-client.js';
import type { PokeApiListResponse, PokeApiPokemonResponse, PokeApiStat } from './poke-api.types.js';

function extractIdFromUrl(url: string): number {
  const match = /\/pokemon\/(\d+)\/?$/.exec(url);
  return match ? Number(match[1]) : 0;
}

function findStat(stats: PokeApiStat[], name: string): number {
  return stats.find((s) => s.stat.name === name)?.base_stat ?? 0;
}

// Prefers the high-resolution official-artwork sprite over the low-res default.
function extractSprite(sprites: PokeApiPokemonResponse['sprites']): string | null {
  return sprites.other?.['official-artwork']?.front_default ?? sprites.front_default;
}

function toDomainPokemon(raw: PokeApiPokemonResponse): Pokemon {
  return {
    id: raw.id,
    name: raw.name,
    height: raw.height,
    weight: raw.weight,
    types: raw.types.map((t) => t.type.name),
    sprite: extractSprite(raw.sprites),
    stats: {
      hp: findStat(raw.stats, 'hp'),
      attack: findStat(raw.stats, 'attack'),
      defense: findStat(raw.stats, 'defense'),
      specialAttack: findStat(raw.stats, 'special-attack'),
      specialDefense: findStat(raw.stats, 'special-defense'),
      speed: findStat(raw.stats, 'speed'),
    },
  };
}

export class PokeApiRepository implements PokemonRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async list(limit: number, offset: number): Promise<PaginatedResult<PokemonSummary>> {
    const data = await this.httpClient.get<PokeApiListResponse>(
      `/pokemon?limit=${limit}&offset=${offset}`,
    );

    const items: PokemonSummary[] = data.results.map((result) => {
      const id = extractIdFromUrl(result.url);
      return {
        id,
        name: result.name,
        // High-resolution official-artwork sprite; avoids per-item detail fetches for the list view.
        sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
      };
    });

    return { items, total: data.count, limit, offset };
  }

  async findByName(name: string): Promise<Pokemon | null> {
    try {
      const raw = await this.httpClient.get<PokeApiPokemonResponse>(
        `/pokemon/${name.toLowerCase()}`,
      );
      return toDomainPokemon(raw);
    } catch {
      return null;
    }
  }
}
