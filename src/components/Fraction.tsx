import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

const SIZES = {
  sm: { fontSize: 17, bar: 1.5, padX: 4 },
  md: { fontSize: 24, bar: 2, padX: 5 },
  lg: { fontSize: 28, bar: 2, padX: 6 },
} as const;

type Props = {
  numerator: string | number;
  denominator: string | number;
  size?: keyof typeof SIZES;
  color?: string;
};

/** Uma fração desenhada, com o numerador sobre o denominador. O leitor de tela lê "1 sobre 2". */
export function Fraction({ numerator, denominator, size = 'md', color = colors.ink }: Props) {
  const s = SIZES[size];
  const text = {
    fontFamily: fonts.displaySemi,
    fontSize: s.fontSize,
    lineHeight: s.fontSize * 1.1,
    color,
  };

  return (
    <View
      accessible
      accessibilityLabel={`${numerator} sobre ${denominator}`}
      style={styles.fraction}
    >
      <Text
        maxFontSizeMultiplier={2}
        style={[text, { paddingHorizontal: s.padX, borderBottomWidth: s.bar, borderColor: color }]}
      >
        {numerator}
      </Text>
      <Text maxFontSizeMultiplier={2} style={[text, { paddingHorizontal: s.padX }]}>
        {denominator}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fraction: { alignItems: 'center', justifyContent: 'center' },
});
