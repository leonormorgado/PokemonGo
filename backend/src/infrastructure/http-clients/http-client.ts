export class HttpClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'HttpClientError';
  }
}

export interface HttpClient {
  get<T>(path: string): Promise<T>;
}

export class FetchHttpClient implements HttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number,
  ) {}

  async get<T>(path: string): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new HttpClientError(`Request to ${path} failed with status ${response.status}`, response.status);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof HttpClientError) throw error;
      throw new HttpClientError(`Request to ${path} failed: ${(error as Error).message}`);
    } finally {
      clearTimeout(timeout);
    }
  }
}
