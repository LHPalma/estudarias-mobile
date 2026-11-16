import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { ScoreBar } from './ScoreBar';

export type TopicStatus = 'locked' | 'available' | 'mastered';

type Props = {
  name: string;
  status: TopicStatus;
  /** A nota do tópico, ou nula sem nenhuma resposta. */
  score: number | null;
  /** Para o tópico bloqueado: o que ele exige ("Requer Frações"). */
  requires?: string;
  /** Linha de apoio do tópico disponível, como "3 de 4 lições concluídas" (#91 no back). */
  detail?: string;
  goal?: number;
  onPress: () => void;
};

/**
 * O cartão de um tópico na trilha, nos três status do canvas. O disponível é o destaque (borda azul, barra da nota e
 * "Continuar"); o dominado é discreto; o bloqueado é apagado e diz o que falta. Todos abrem o tópico: o bloqueado abre
 * para mostrar os pré-requisitos.
 */
export function TopicCard({ name, status, score, requires, detail, goal = 70, onPress }: Props) {
  const shown = score === null ? null : Math.floor(score);

  if (status === 'mastered') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${name}, dominado, nota ${shown ?? '-'}`}
        onPress={onPress}
        style={[styles.card, styles.mastered]}
      >
        <AppText variant="overline" color="masteredInk">
          Dominado
        </AppText>
        <AppText variant="heading">{name}</AppText>
        <AppText variant="support" color="inkSoft">
          Nota {shown ?? '–'}
        </AppText>
      </Pressable>
    );
  }

  if (status === 'locked') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${name}, bloqueado${requires ? `. ${requires}` : ''}`}
        onPress={onPress}
        style={[styles.card, styles.locked]}
      >
        <AppText variant="overline" color="inkMuted">
          Bloqueado
        </AppText>
        <AppText variant="heading" color="inkStrong">
          {name}
        </AppText>
        {requires ? (
          <AppText variant="support" color="inkMuted">
            {requires}
          </AppText>
        ) : null}
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${score === null ? 'disponível' : `em andamento, nota ${shown}, meta ${goal}`}`}
      onPress={onPress}
      style={[styles.card, styles.available]}
    >
      <AppText variant="overline" color="progress">
        {score === null ? 'Disponível' : 'Em andamento'}
      </AppText>
      <AppText variant="title">{name}</AppText>
      {detail ? (
        <AppText variant="support" color="inkSoft">
          {detail}
        </AppText>
      ) : null}
      <View style={styles.score}>
        <ScoreBar score={score} goal={goal} height={8} />
        <View style={styles.scoreLabels}>
          <AppText variant="support" color="inkSoft">
            Nota {shown ?? '–'}
          </AppText>
          <AppText variant="support" color="inkSoft">
            Meta {goal}
          </AppText>
        </View>
      </View>
      <View style={styles.continue}>
        <AppText variant="bodyStrong" color="progress">
          Continuar
        </AppText>
        <Icon name="chevronRight" color={colors.progress} strokeWidth={2.4} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: spacing.md + 2, gap: 2 },
  mastered: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  locked: { backgroundColor: colors.muted },
  available: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.progress,
    borderRadius: radius.lg + 2,
    padding: spacing.lg,
  },
  score: { marginTop: spacing.md, gap: spacing.xs + 2 },
  scoreLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  continue: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
