import { randomBytes } from 'node:crypto';
import type { PokemonSummary } from '../../domain/entities/pokemon.entity.js';
import { NotFoundError, ValidationError } from '../../shared/errors.js';
import type { PokemonService } from './pokemon.service.js';

export interface SharedDeck {
  key: string;
  title: string;
  pokemon: PokemonSummary[];
}

export class DeckShareService {
  private readonly decks = new Map<string, SharedDeck>();

  constructor(private readonly pokemonService: PokemonService) {}

  async create(input: unknown): Promise<SharedDeck> {
    if (!input || typeof input !== 'object') throw new ValidationError('Invalid deck');
    const { title, pokemonIds } = input as Record<string, unknown>;
    if (typeof title !== 'string' || !title.trim() || title.trim().length > 80) {
      throw new ValidationError('title must be between 1 and 80 characters');
    }
    if (
      !Array.isArray(pokemonIds) ||
      pokemonIds.length === 0 ||
      pokemonIds.length > 2000 ||
      pokemonIds.some((id) => !Number.isSafeInteger(id) || id <= 0) ||
      new Set(pokemonIds).size !== pokemonIds.length
    ) {
      throw new ValidationError('pokemonIds must be a nonempty list of unique positive IDs');
    }

    const wanted = new Set<number>(pokemonIds);
    const pokemon: PokemonSummary[] = [];
    let offset = 0;
    do {
      const page = await this.pokemonService.list(200, offset);
      pokemon.push(...page.items.filter((item) => wanted.has(item.id)));
      offset += page.items.length;
      if (offset >= page.total || page.items.length === 0) break;
    } while (pokemon.length < wanted.size);

    if (pokemon.length !== wanted.size)
      throw new ValidationError('pokemonIds contains an unknown Pokémon');
    const deck: SharedDeck = {
      key: randomBytes(16).toString('hex'),
      title: title.trim(),
      pokemon,
    };
    this.decks.set(deck.key, deck);
    return deck;
  }

  get(key: string): SharedDeck {
    const deck = this.decks.get(key);
    if (!deck) throw new NotFoundError('Shared deck not found');
    return deck;
  }
}
