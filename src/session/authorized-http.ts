import { ApiError, NetworkError } from '@/api/errors';
import type { Http } from '@/api/http';

import type { SessionManager } from './session-manager';

/**
 * Faz o cliente HTTP renovar a sessão sozinho: num 401, renova uma vez e repete a chamada. Se a renovação for recusada, a
 * sessão acaba (o aluno volta ao login com o aviso) e o 401 segue para quem chamou.
 */
export function withSessionRetry(http: Http, session: SessionManager): Http {
  async function attempt<T>(call: () => Promise<T>): Promise<T> {
    try {
      return await call();
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        throw error;
      }

      const outcome = await session.refresh();
      if (outcome === 'refreshed') {
        return call();
      }
      if (outcome === 'offline') {
        throw new NetworkError(false, error);
      }
      throw error;
    }
  }

  return {
    get: (path) => attempt(() => http.get(path)),
    post: (path, body) => attempt(() => http.post(path, body)),
  };
}
