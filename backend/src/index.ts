import { createApp } from './app.js';
import { PokemonService } from './application/services/pokemon.service.js';
import { config } from './infrastructure/config/env.js';
import { FetchHttpClient } from './infrastructure/http-clients/http-client.js';
import { PokeApiRepository } from './infrastructure/repositories/poke-api.repository.js';
import { logger } from './shared/logger.js';

const httpClient = new FetchHttpClient(config.pokeApiBaseUrl, config.pokeApiTimeoutMs);
const repository = new PokeApiRepository(httpClient);
const pokemonService = new PokemonService(repository);

const app = createApp(pokemonService, config.corsOrigin);

app.listen(config.port, () => {
  logger.info(`Server listening on port ${config.port}`);
});
