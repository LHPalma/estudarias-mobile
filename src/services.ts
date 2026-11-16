import { createHttpAuthApi, type AuthApi } from '@/api/auth';
import { createHttpApi, type ApiClient } from '@/api/client';
import { apiConfig } from '@/api/config';
import { createHttp } from '@/api/http';
import { SessionManager, deviceTokenStorage, withSessionRetry } from '@/session';

type MockModule = typeof import('@/api/mock/mock-api');

export type AppServices = { api: ApiClient; session: SessionManager };

/**
 * Monta o que o app usa para falar com o back: a API e a sessão. Com EXPO_PUBLIC_API_MOCK=true, os dois respondem do modo
 * mock, sem rede. O require fica dentro do if para o mock não entrar no pacote quando a variável está desligada: o Expo
 * embute o valor no build, e o bundler descarta o ramo morto.
 */
export function createAppServices(): AppServices {
  if (apiConfig.mock) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mock: MockModule = require('@/api/mock/mock-api');
    const { api, auth } = mock.createMockBackend({
      group: apiConfig.mockGroup,
      latencyMs: apiConfig.mockLatencyMs,
    });
    return { api, session: new SessionManager(auth, deviceTokenStorage) };
  }

  // Os endpoints de sessão são abertos e não levam token; os demais levam o da sessão e a renovam num 401.
  const auth: AuthApi = createHttpAuthApi(createHttp({ baseUrl: apiConfig.baseUrl }));
  const session = new SessionManager(auth, deviceTokenStorage);
  const http = withSessionRetry(
    createHttp({ baseUrl: apiConfig.baseUrl, getAccessToken: session.getAccessToken }),
    session,
  );

  return { api: createHttpApi(http), session };
}
