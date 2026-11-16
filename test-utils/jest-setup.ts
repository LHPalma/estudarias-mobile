// Os testes de tela rodam contra o modo mock, sem atraso artificial. Fica em setupFiles para valer antes de qualquer módulo
// ler as variáveis.
process.env.EXPO_PUBLIC_API_MOCK = 'true';
process.env.EXPO_PUBLIC_MOCK_LATENCY_MS = '0';
