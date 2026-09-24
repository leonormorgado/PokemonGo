import type { PaginatedResult, Pokemon, PokemonSummary } from '../../domain/entities/pokemon.entity.js';
import type { PokemonRepository } from '../../domain/repositories/pokemon.repository.js';
import type { HttpClient } from '../http-clients/http-client.js';
import type {
  PokeApiListResponse,
  PokeApiPokemonResponse,
  PokeApiStat,
  PokeApiTypeResponse,
} from './poke-api.types.js';

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
  // In-memory cache of the full (unpaginated) name/url roster, so a `search`-only query doesn't
  // refetch all ~1351 entries from PokéAPI on every keystroke/page. The dex never changes at
  // runtime, so this never needs invalidating.
  private fullRosterPromise: Promise<PokeApiListResponse> | null = null;

  constructor(private readonly httpClient: HttpClient) {}

  async list(
    limit: number,
    offset: number,
    type?: string,
    search?: string,
  ): Promise<PaginatedResult<PokemonSummary>> {
    if (type) {
      return this.listByType(limit, offset, type, search);
    }
    if (search) {
      return this.listBySearch(limit, offset, search);
    }

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

  private getFullRoster(): Promise<PokeApiListResponse> {
    // Over-fetch limit: covers every Pokémon in one call since PokéAPI's list is otherwise
    // paginated at 20/request by default.
    this.fullRosterPromise ??= this.httpClient.get<PokeApiListResponse>('/pokemon?limit=100000&offset=0');
    return this.fullRosterPromise;
  }

  // Combines a name substring search across the whole dex (not just loaded pages) with
  // offset/limit pagination applied to the filtered result.
  private async listBySearch(limit: number, offset: number, search: string): Promise<PaginatedResult<PokemonSummary>> {
    const data = await this.getFullRoster();
    const query = search.toLowerCase();
    const matches = data.results.filter((result) => result.name.includes(query));
    const page = matches.slice(offset, offset + limit);

    const items: PokemonSummary[] = page.map((result) => {
      const id = extractIdFromUrl(result.url);
      return {
        id,
        name: result.name,
        sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
      };
    });

    return { items, total: matches.length, limit, offset };
  }

  // PokéAPI's /type endpoint isn't paginated: it returns every Pokémon of that type in one
  // response, so pagination (and an optional search AND'd on top) is applied on our side.
  private async listByType(
    limit: number,
    offset: number,
    type: string,
    search?: string,
  ): Promise<PaginatedResult<PokemonSummary>> {
    const data = await this.httpClient.get<PokeApiTypeResponse>(`/type/${type.toLowerCase()}`);
    const query = search?.toLowerCase();
    const matches = query
      ? data.pokemon.filter(({ pokemon }) => pokemon.name.includes(query))
      : data.pokemon;
    const page = matches.slice(offset, offset + limit);

    const items: PokemonSummary[] = page.map(({ pokemon }) => {
      const id = extractIdFromUrl(pokemon.url);
      return {
        id,
        name: pokemon.name,
        sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
      };
    });

    return { items, total: matches.length, limit, offset };
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

  async countByType(type: string): Promise<number> {
    const data = await this.httpClient.get<PokeApiTypeResponse>(`/type/${type.toLowerCase()}`);
    return data.pokemon.length;
  }
}
