import type { NextFunction, Request, Response } from 'express';
import type { PokemonService } from '../../../application/services/pokemon.service.js';

export class PokemonController {
  constructor(private readonly service: PokemonService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = Number(req.query['limit'] ?? 20);
      const offset = Number(req.query['offset'] ?? 0);
      const type = typeof req.query['type'] === 'string' ? req.query['type'] : undefined;
      const search = typeof req.query['search'] === 'string' ? req.query['search'].toLowerCase() : undefined;
      const result = await this.service.list(limit, offset, type, search);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getByName = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name } = req.params;
      const pokemon = await this.service.getByName(name ?? '');
      res.status(200).json(pokemon);
    } catch (error) {
      next(error);
    }
  };

  countByType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { type } = req.params;
      const total = await this.service.countByType(type ?? '');
      res.status(200).json({ type, total });
    } catch (error) {
      next(error);
    }
  };
}
