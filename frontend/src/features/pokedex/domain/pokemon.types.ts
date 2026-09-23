export interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface PokemonSummary {
  id: number;
  name: string;
  sprite: string | null;
}

export interface PokemonDetail {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: string[];
  stats: PokemonStats;
  sprite: string | null;
}

// Locally-owned trainer data, persisted independently of the PokéAPI data.
export interface CaughtRecord {
  pokemonId: number;
  caught: boolean;
  caughtAt: string | null; // ISO timestamp
  notes: string;
  tags: string[];
}

export interface CatalogEntry extends PokemonSummary {
  caught: boolean;
  caughtAt: string | null;
  notes: string;
  tags: string[];
  types: string[];
  height?: number | null;
}

export type SortField = 'name' | 'height' | 'types' | 'caughtAt';
export type SortDirection = 'asc' | 'desc';

export interface SortOption {
  field: SortField;
  direction: SortDirection;
}

export interface FilterOptions {
  search: string;
  types: string[];
  caughtOnly: boolean;
}
