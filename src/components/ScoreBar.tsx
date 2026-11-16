import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

type Props = {
  /** A nota de 0 a 100, ou nula quando o aluno ainda não respondeu nada. */
  score: number | null;
  goal?: number;
  tone?: 'progress' | 'mastered';
  height?: number;
};

/**
 * A barra da nota com a marca da meta. A nota exibida é a parte inteira da nota da API, que já vem arredondada para baixo:
 * 69,9 aparece como 69, nunca como 70.
 */
export function ScoreBar({ score, goal = 70, tone = 'progress', height = 10 }: Props) {
  const value = score === null ? 0 : Math.max(0, Math.min(100, score));
  const shown = Math.floor(value);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={
        score === null ? `Sem nota ainda, meta ${goal}` : `Nota ${shown} de 100, meta ${goal}`
      }
      accessibilityValue={{ min: 0, max: 100, now: shown }}
      style={[styles.track, { height, borderRadius: height / 2 }]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${value}%`,
            borderRadius: height / 2,
            backgroundColor: tone === 'mastered' ? colors.mastered : colors.progress,
          },
        ]}
      />
      <View style={[styles.goal, { left: `${goal}%`, top: -4, height: height + 8 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { backgroundColor: colors.track, position: 'relative' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  goal: { position: 'absolute', width: 2, backgroundColor: colors.ink },
});
