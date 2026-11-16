import { Text, type TextProps } from 'react-native';

import { colors, typography, type ColorName, type TypographyVariant } from '@/theme';

type Props = TextProps & {
  variant?: TypographyVariant;
  color?: ColorName;
};

/** O texto do app, numa das variantes da escala. Escala com o tamanho de fonte do sistema, até o dobro. */
export function AppText({ variant = 'body', color = 'ink', style, ...props }: Props) {
  return (
    <Text
      maxFontSizeMultiplier={2}
      {...props}
      style={[typography[variant], { color: colors[color] }, style]}
    />
  );
}
