import { Router } from 'express';
import type { DeckShareService } from '../../../application/services/deck-share.service.js';

export function createDeckShareRouter(service: DeckShareService): Router {
  const router = Router();
  router.post('/', async (req, res, next) => {
    try {
      res.status(201).json(await service.create(req.body));
    } catch (error) {
      next(error);
    }
  });
  router.get('/:key', (req, res, next) => {
    try {
      res.status(200).json(service.get(req.params.key ?? ''));
    } catch (error) {
      next(error);
    }
  });
  return router;
}
