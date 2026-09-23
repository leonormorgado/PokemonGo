import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { PokemonService } from '../../src/application/services/pokemon.service.js';
import type { PaginatedResult, Pokemon, PokemonSummary } from '../../src/domain/entities/pokemon.entity.js';
import type { PokemonRepository } from '../../src/domain/repositories/pokemon.repository.js';

class FakePokemonRepository implements PokemonRepository {
  async list(limit: number, offset: number): Promise<PaginatedResult<PokemonSummary>> {
    return {
      items: [{ id: 1, name: 'bulbasaur', sprite: 'https://example.com/1.png' }],
      total: 1,
      limit,
      offset,
    };
  }

  async findByName(name: string): Promise<Pokemon | null> {
    if (name !== 'bulbasaur') return null;
    return {
      id: 1,
      name: 'bulbasaur',
      height: 7,
      weight: 69,
      types: ['grass', 'poison'],
      sprite: 'https://example.com/1.png',
      stats: { hp: 45, attack: 49, defense: 49, specialAttack: 65, specialDefense: 65, speed: 45 },
    };
  }
}

const service = new PokemonService(new FakePokemonRepository());
const app = createApp(service, 'http://localhost:5173');

describe('GET /health', () => {
  it('returns ok status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});

describe('GET /api/pokemon', () => {
  it('returns a paginated list', async () => {
    const response = await request(app).get('/api/pokemon?limit=10&offset=0');
    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
  });

  it('returns 400 for invalid limit', async () => {
    const response = await request(app).get('/api/pokemon?limit=0');
    expect(response.status).toBe(400);
  });
});

describe('GET /api/pokemon/:name', () => {
  it('returns pokemon detail', async () => {
    const response = await request(app).get('/api/pokemon/bulbasaur');
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('bulbasaur');
  });

  it('returns 404 when not found', async () => {
    const response = await request(app).get('/api/pokemon/missingno');
    expect(response.status).toBe(404);
  });
});
