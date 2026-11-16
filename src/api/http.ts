import { ApiError, NetworkError } from './errors';

export type HttpOptions = {
  baseUrl: string;
  /** O access token da sessão, se houver. A sessão (#5) injeta a função. */
  getAccessToken?: () => string | null;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
};

export type Http = {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
};

const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * O cliente HTTP da API: JSON, `Authorization: Bearer` quando há sessão e tempo limite. Uma resposta de erro vira ApiError;
 * nenhuma resposta (rede ou tempo) vira NetworkError.
 */
export function createHttp({
  baseUrl,
  getAccessToken,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  fetchFn = fetch,
}: HttpOptions): Http {
  const base = baseUrl.replace(/\/+$/, '');

  async function request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const headers: Record<string, string> = { Accept: 'application/json' };
    const token = getAccessToken?.();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    let response: Response;
    try {
      response = await fetchFn(`${base}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error) {
      throw new NetworkError(controller.signal.aborted, error);
    } finally {
      clearTimeout(timer);
    }

    const text = await response.text();
    const parsed: unknown = text.length > 0 ? safeJson(text) : undefined;

    if (!response.ok) {
      throw ApiError.fromProblem(response.status, parsed);
    }

    return parsed as T;
  }

  return {
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
  };
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
