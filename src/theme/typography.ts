import type { TextStyle } from 'react-native';

import { fonts } from './fonts';

/** A escala de texto do canvas. Bricolage Grotesque nos títulos e números; Instrument Sans no texto. */
export const typography = {
  display: { fontFamily: fonts.display, fontSize: 32, lineHeight: 36, letterSpacing: -0.6 },
  title: { fontFamily: fonts.displaySemi, fontSize: 22, lineHeight: 28 },
  heading: { fontFamily: fonts.displaySemi, fontSize: 18, lineHeight: 24 },
  score: { fontFamily: fonts.display, fontSize: 40, lineHeight: 44 },
  body: { fontFamily: fonts.body, fontSize: 17, lineHeight: 26 },
  bodyStrong: { fontFamily: fonts.bodySemi, fontSize: 17, lineHeight: 24 },
  support: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 20 },
  overline: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
