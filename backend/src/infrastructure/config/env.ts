import 'dotenv/config';

function getEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(getEnv('PORT', '4000')),
  nodeEnv: getEnv('NODE_ENV', 'development'),
  pokeApiBaseUrl: getEnv('POKEAPI_BASE_URL', 'https://pokeapi.co/api/v2'),
  pokeApiTimeoutMs: Number(getEnv('POKEAPI_TIMEOUT_MS', '8000')),
  corsOrigin: getEnv('CORS_ORIGIN', 'http://localhost:5173'),
} as const;
