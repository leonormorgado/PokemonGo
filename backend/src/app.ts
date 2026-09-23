import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import type { PokemonService } from './application/services/pokemon.service.js';
import { errorHandler } from './interfaces/http/middlewares/error-handler.middleware.js';
import { createPokemonRouter } from './interfaces/http/routes/pokemon.routes.js';
import { logger } from './shared/logger.js';

export function createApp(pokemonService: PokemonService, corsOrigin: string): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json());
  app.use(pinoHttp({ logger }));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/pokemon', createPokemonRouter(pokemonService));

  app.use(errorHandler);

  return app;
}
