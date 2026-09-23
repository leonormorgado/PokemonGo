export const pokedexKeys = {
  all: ['pokedex'] as const,
  list: (limit: number, offset: number) => [...pokedexKeys.all, 'list', limit, offset] as const,
  detail: (name: string) => [...pokedexKeys.all, 'detail', name] as const,
  caughtRecords: ['pokedex', 'caughtRecords'] as const,
};
