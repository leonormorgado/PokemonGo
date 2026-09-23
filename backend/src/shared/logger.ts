import pino from 'pino';
import { config } from '../infrastructure/config/env.js';

export const logger = pino({
  level: config.nodeEnv === 'test' ? 'silent' : 'info',
});
