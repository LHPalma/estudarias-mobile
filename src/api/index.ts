import type { ApiClient } from './client';
import { createHttpApi } from './client';
import { apiConfig } from './config';
import { createHttp } from './http';

export { ApiProvider, createQueryClient, useApi } from './ApiProvider';
export type { ApiClient } from './client';
export { ApiError, NetworkError, isApiError } from './errors';
export { findLink, hasLink } from './links';
export * from './queries';
export type * from './types';

let accessTokenProvider: () => string | null = () => null;

/** A sessão (#5) registra aqui de onde vem o access token de cada chamada. */
export function setAccessTokenProvider(provider: () => string | null): void {
  accessTokenProvider = provider;
}

/**
 * O cliente da API do app. Com EXPO_PUBLIC_API_MOCK=true, responde do modo mock, sem rede. O require fica dentro do if
 * para o mock não entrar no pacote quando a variável está desligada: o Expo embute o valor no build, e o bundler descarta
 * o ramo morto.
 */
export function createAppApi(): ApiClient {
  if (apiConfig.mock) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createMockApi } = require('./mock/mock-api') as typeof import('./mock/mock-api');
    return createMockApi({ group: apiConfig.mockGroup, latencyMs: 300 });
  }

  return createHttpApi(
    createHttp({ baseUrl: apiConfig.baseUrl, getAccessToken: () => accessTokenProvider() }),
  );
}
