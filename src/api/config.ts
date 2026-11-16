/**
 * A configuração da API vem de variáveis EXPO_PUBLIC_*, que o Expo embute no pacote na hora do build (veja o README).
 * Sem EXPO_PUBLIC_API_URL, o app aponta para a API local do back.
 */
export const apiConfig = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5007',
  mock: process.env.EXPO_PUBLIC_API_MOCK === 'true',
  mockLatencyMs: Number(process.env.EXPO_PUBLIC_MOCK_LATENCY_MS ?? 300),
  mockGroup: process.env.EXPO_PUBLIC_MOCK_GROUP === 'control' ? 'control' : 'diagnostic',
} as const;
