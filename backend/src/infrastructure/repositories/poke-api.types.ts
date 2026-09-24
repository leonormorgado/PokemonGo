// Raw response shapes as returned by the external PokéAPI (snake_case, untyped upstream).
export interface PokeApiListResponse {
  count: number;
  results: Array<{ name: string; url: string }>;
}

export interface PokeApiTypeResponse {
  pokemon: Array<{ pokemon: { name: string; url: string } }>;
}

export interface PokeApiTypeSlot {
  type: { name: string };
}

export interface PokeApiStat {
  base_stat: number;
  stat: { name: string };
}

export interface PokeApiPokemonResponse {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: PokeApiTypeSlot[];
  stats: PokeApiStat[];
  sprites: {
    front_default: string | null;
    other?: { 'official-artwork'?: { front_default: string | null } };
  };
}
