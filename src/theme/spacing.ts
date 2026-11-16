/** Espaçamento em múltiplos de 4 e os raios do canvas. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
} as const;

/** Altura mínima de qualquer alvo de toque, pela diretriz de acessibilidade. */
export const minTouchTarget = 44;
