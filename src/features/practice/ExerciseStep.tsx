import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { LessonExercise } from '@/api';
import {
  AlternativeOption,
  AppText,
  Button,
  Icon,
  IconButton,
  MathText,
  Notice,
  Screen,
  StatusBadge,
  type AlternativeState,
} from '@/components';
import { colors, radius, spacing } from '@/theme';

import type { Answered } from './progress';
import { ScoreChange } from './ScoreChange';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export type Outcome = 'correct' | 'wrong' | null;

type Props = {
  exercise: LessonExercise;
  /** O resultado de cada exercício da lição, na ordem; nulo para os que faltam. */
  outcomes: Outcome[];
  position: number;
  /** A resposta certa que acabou de ser dada a este exercício, quando é o caso: a tela mostra a faixa verde. */
  answered?: Answered;
  submitting: boolean;
  failed: boolean;
  onSubmit: (alternativeId: string, responseSeconds: number) => void;
  onContinue: () => void;
  onExit: () => void;
};

/** Um exercício: o progresso da lição, o enunciado, as alternativas e "Responder". O acerto aparece aqui mesmo. */
export function ExerciseStep({
  exercise,
  outcomes,
  position,
  answered,
  submitting,
  failed,
  onSubmit,
  onContinue,
  onExit,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const stateOf = (alternativeId: string): AlternativeState => {
    if (answered) {
      return alternativeId === answered.result.correctAlternativeId ? 'correct' : 'dimmed';
    }
    return alternativeId === selected ? 'selected' : 'idle';
  };

  return (
    <Screen
      edges={['top', 'left', 'right', 'bottom']}
      footer={
        answered ? (
          <>
            <View style={styles.strip} accessibilityRole="alert" accessibilityLiveRegion="polite">
              <View style={styles.stripIcon}>
                <Icon name="check" size={18} color={colors.onStrong} strokeWidth={3} />
              </View>
              <View style={styles.fill}>
                <AppText variant="bodyStrong" color="masteredInk">
                  Resposta certa
                </AppText>
                <ScoreChange
                  from={answered.previousScore}
                  to={answered.result.topic.score}
                  color="masteredInk"
                />
              </View>
            </View>
            <Button label="Continuar" variant="success" onPress={onContinue} />
          </>
        ) : (
          <>
            {failed ? (
              <Notice>
                Não foi possível enviar a resposta. Confira a internet e tente de novo.
              </Notice>
            ) : null}
            <Button
              label="Responder"
              disabled={selected === null}
              loading={submitting}
              onPress={() => {
                if (selected !== null) {
                  onSubmit(selected, Math.round((Date.now() - startedAt.current) / 1000));
                }
              }}
            />
          </>
        )
      }
    >
      <View style={styles.top}>
        <IconButton icon="close" label="Sair dos exercícios" onPress={onExit} />
        <View
          style={styles.segments}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={`Exercício ${position} de ${outcomes.length}`}
        >
          {outcomes.map((outcome, index) => (
            <View
              key={index}
              style={[
                styles.segment,
                outcome === 'correct' && styles.segmentCorrect,
                outcome === 'wrong' && styles.segmentWrong,
                outcome === null && index === position - 1 && styles.segmentCurrent,
              ]}
            />
          ))}
        </View>
      </View>

      <StatusBadge kind={exercise.difficulty} />
      <MathText variant="title" fractionSize="lg">
        {exercise.statement}
      </MathText>

      <View style={styles.grid} accessibilityRole="radiogroup">
        {exercise.alternatives.map((alternative, index) => (
          <View key={alternative.id} style={styles.cell}>
            <AlternativeOption
              letter={LETTERS[index] ?? String(index + 1)}
              text={alternative.text}
              state={stateOf(alternative.id)}
              disabled={Boolean(answered) || submitting}
              onPress={() => setSelected(alternative.id)}
            />
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  segments: { flex: 1, flexDirection: 'row', gap: spacing.xs + 2 },
  segment: { flex: 1, height: 8, borderRadius: radius.pill, backgroundColor: colors.track },
  segmentCorrect: { backgroundColor: colors.mastered },
  segmentWrong: { backgroundColor: colors.error },
  segmentCurrent: { backgroundColor: colors.lineStrong },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  cell: { flexBasis: '45%', flexGrow: 1 },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.masteredSoft,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  stripIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.mastered,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
