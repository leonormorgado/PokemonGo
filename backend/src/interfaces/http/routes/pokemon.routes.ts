import { Router } from 'express';
import type { PokemonService } from '../../../application/services/pokemon.service.js';
import { PokemonController } from '../controllers/pokemon.controller.js';

export function createPokemonRouter(service: PokemonService): Router {
  const router = Router();
  const controller = new PokemonController(service);

  router.get('/', controller.list);
  router.get('/types/:type/count', controller.countByType);
  router.get('/:name', controller.getByName);

  return router;
}
