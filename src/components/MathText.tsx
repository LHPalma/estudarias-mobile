import { StyleSheet, View } from 'react-native';

import { parseMath, speakMath } from '@/lib/math-markup';
import { colors, typography, type ColorName, type TypographyVariant } from '@/theme';

import { AppText } from './AppText';
import { Fraction } from './Fraction';

type Props = {
  children: string;
  variant?: TypographyVariant;
  color?: ColorName;
  fractionSize?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'center';
};

/**
 * Texto com frações: `Quanto é {1/2} + {1/3}?` desenha as frações no meio da frase. O texto é quebrado em palavras para a
 * linha quebrar naturalmente ao redor das frações. Para o leitor de tela, o conjunto é um só rótulo ("Quanto é 1 sobre 2
 * mais..."), lido de uma vez.
 */
export function MathText({
  children,
  variant = 'body',
  color = 'ink',
  fractionSize = 'md',
  align = 'left',
}: Props) {
  const segments = parseMath(children);

  return (
    <View
      accessible
      accessibilityLabel={speakMath(children)}
      style={[styles.line, { justifyContent: align === 'center' ? 'center' : 'flex-start' }]}
    >
      {segments.flatMap((segment, index) =>
        segment.kind === 'fraction'
          ? [
              <Fraction
                key={`f${index}`}
                numerator={segment.numerator}
                denominator={segment.denominator}
                size={fractionSize}
                color={colors[color]}
              />,
            ]
          : segment.value
              .split(/(\s+)/)
              .filter((word) => word.length > 0 && word.trim().length > 0)
              .map((word, wordIndex) => (
                <AppText
                  key={`t${index}-${wordIndex}`}
                  variant={variant}
                  color={color}
                  style={{ lineHeight: typography[variant].lineHeight }}
                >
                  {word}
                </AppText>
              )),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  line: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 6, rowGap: 4 },
});
