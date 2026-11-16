import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, useContext, useState, type ReactNode } from 'react';

import type { ApiClient } from './client';
import { ApiError } from './errors';

const ApiContext = createContext<ApiClient | null>(null);

/** O cliente da API que as telas usam. Vem do ApiProvider, para os testes poderem trocar pelo mock. */
export function useApi(): ApiClient {
  const api = useContext(ApiContext);
  if (!api) {
    throw new Error('useApi precisa estar dentro de um ApiProvider.');
  }
  return api;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Erro com resposta do servidor (4xx/5xx) não melhora tentando de novo; só falta de rede, uma vez.
        retry: (failureCount, error) => !(error instanceof ApiError) && failureCount < 1,
        staleTime: 30_000,
      },
      mutations: { retry: false },
    },
  });
}

type Props = { api: ApiClient; children: ReactNode; queryClient?: QueryClient };

export function ApiProvider({ api, children, queryClient }: Props) {
  const [client] = useState(() => queryClient ?? createQueryClient());

  return (
    <ApiContext.Provider value={api}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </ApiContext.Provider>
  );
}
