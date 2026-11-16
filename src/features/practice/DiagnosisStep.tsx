import { StyleSheet, View } from 'react-native';

import type { LessonExercise } from '@/api';
import { AppText, Button, Card, Icon, MathText, Screen } from '@/components';
import { whenLabel } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';

import type { Answered } from './progress';
import { ScoreChange } from './ScoreChange';

type Props = { exercise: LessonExercise; answered: Answered; onContinue: () => void };

/**
 * O retorno de um erro. Com diagnóstico (`incorrectWithDiagnosis`), explica o tipo de erro; sem ele (`incorrect`), mostra só
 * que errou, as duas respostas e a nota. A tela decide pelo `kind` da resposta: o app não sabe o grupo do aluno.
 */
export function DiagnosisStep({ exercise, answered, onContinue }: Props) {
  const { result } = answered;
  const errorType =
    result.feedback.kind === 'incorrectWithDiagnosis' ? result.feedback.errorType : null;
  const chosen = exercise.alternatives.find((alternative) => alternative.id === answered.chosenId);

  return (
    <Screen
      edges={['top', 'left', 'right', 'bottom']}
      footer={<Button label="Continuar" onPress={onContinue} />}
    >
      <View style={styles.heading}>
        <AppText variant="overline" color="error">
          {errorType ? 'Resposta incorreta' : 'Não foi desta vez'}
        </AppText>
        <AppText variant="display" accessibilityRole="header">
          {errorType ? 'Vamos entender o erro' : 'Resposta incorreta'}
        </AppText>
      </View>

      <MathText color="inkStrong" fractionSize="sm">
        {exercise.statement}
      </MathText>

      <View style={styles.answers}>
        <View style={[styles.answer, styles.answerWrong]}>
          <AppText variant="label" color="errorInk">
            Sua resposta
          </AppText>
          <MathText variant="title" color="errorInk" fractionSize="lg" align="center">
            {chosen?.text ?? ''}
          </MathText>
        </View>
        <View style={[styles.answer, styles.answerRight]}>
          <AppText variant="label" color="masteredInk">
            Resposta correta
          </AppText>
          <MathText variant="title" color="masteredInk" fractionSize="lg" align="center">
            {result.feedback.correctAnswer}
          </MathText>
        </View>
      </View>

      <ScoreChange from={answered.previousScore} to={result.topic.score} />

      {errorType ? (
        <Card>
          <AppText variant="overline" color="inkSoft">
            O que aconteceu
          </AppText>
          <AppText variant="heading">{errorType.name}</AppText>
          <MathText color="inkBody" fractionSize="sm">
            {errorType.feedback}
          </MathText>
        </Card>
      ) : null}

      {result.flashcard ? (
        <View style={styles.flashcard}>
          <Icon name="cards" color={colors.progressInk} />
          <AppText variant="label" color="progressInk" style={styles.fill}>
            Criamos um flashcard deste erro. Ele entra na sua revisão{' '}
            {whenLabel(result.flashcard.nextReviewAt)}.
          </AppText>
        </View>
      ) : errorType ? (
        <View style={styles.flashcard}>
          <Icon name="cards" color={colors.progressInk} />
          <AppText variant="label" color="progressInk" style={styles.fill}>
            Você já tem um flashcard deste erro na sua revisão.
          </AppText>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  heading: { gap: spacing.xs },
  answers: { flexDirection: 'row', gap: spacing.md },
  answer: {
    flex: 1,
    minHeight: 112,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  answerWrong: { backgroundColor: colors.errorSoft },
  answerRight: { backgroundColor: colors.masteredSoft },
  flashcard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.progressSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
