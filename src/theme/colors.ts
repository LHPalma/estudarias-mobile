/**
 * As cores do app, como na folha "Tokens e componentes" do canvas de design. Cada par forte/suave serve um estado: o forte
 * para preenchimento e ícone, o suave para fundo, e o `*Ink` para texto sobre o suave, com contraste AA.
 */
export const colors = {
  paper: '#F4F1E8',
  surface: '#FFFFFF',
  line: '#DCD6C8',
  lineStrong: '#C9C2B0',
  muted: '#ECE8DC',
  track: '#E9E4D6',

  ink: '#1A1916',
  inkBody: '#26241F',
  inkStrong: '#3F3C35',
  inkSoft: '#5C5951',
  inkMuted: '#625E55',

  progress: '#2846C8',
  progressSoft: '#E6EAFB',
  progressInk: '#1D36A0',

  mastered: '#1E7B4F',
  masteredSoft: '#DDF0E5',
  masteredInk: '#175F3C',

  error: '#B23A1E',
  errorSoft: '#FBE7E0',
  errorInk: '#8E2A14',

  onStrong: '#FFFFFF',
} as const;

export type ColorName = keyof typeof colors;
