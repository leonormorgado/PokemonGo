export const pokedexKeys = {
  all: ['pokedex'] as const,
  list: (limit: number, type?: string, search?: string) =>
    [...pokedexKeys.all, 'list', limit, type ?? null, search ?? null] as const,
  detail: (name: string) => [...pokedexKeys.all, 'detail', name] as const,
  typeCount: (type: string) => [...pokedexKeys.all, 'typeCount', type] as const,
  caughtRecords: ['pokedex', 'caughtRecords'] as const,
};
