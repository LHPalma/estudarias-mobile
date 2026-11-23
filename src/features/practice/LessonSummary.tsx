import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Screen } from '@/components';
import { plural, shownScore } from '@/lib/format';
import { colors, spacing } from '@/theme';

import type { Answered } from './progress';

type Props = {
  lessonTitle: string;
  answers: Answered[];
  /** Quantos cartões há para revisar agora: com algum, a tela oferece ir para a revisão. */
  dueReviews: number;
  onReview: () => void;
  onBackToTrail: () => void;
};

/**
 * O fim da prática: quantos acertos, como ficou a lição e a nota do tópico e quantos flashcards os erros criaram. Só diz
 * "Lição concluída" quando a API diz que a lição está concluída.
 */
export function LessonSummary({
  lessonTitle,
  answers,
  dueReviews,
  onReview,
  onBackToTrail,
}: Props) {
  const correct = answers.filter((answer) => answer.result.isCorrect).length;
  const newCards = answers.filter((answer) => answer.result.flashcard !== null).length;
  const last = answers[answers.length - 1];
  const lesson = last?.result.lesson;
  // "Lição concluída" só quando a API diz que ela está concluída: acertar cada exercício pelo menos uma vez.
  const completed = lesson?.status === 'completed';

  return (
    <Screen
      edges={['top', 'left', 'right', 'bottom']}
      footer={
        <>
          {dueReviews > 0 ? <Button label="Revisar flashcards" onPress={onReview} /> : null}
          <Button
            label="Voltar para a trilha"
            variant={dueReviews > 0 ? 'secondary' : 'primary'}
            onPress={onBackToTrail}
          />
        </>
      }
    >
      <View style={styles.heading}>
        <AppText variant="overline" color={completed ? 'masteredInk' : 'progress'}>
          {completed ? 'Lição concluída' : 'Fim da prática'}
        </AppText>
        <AppText variant="display" accessibilityRole="header">
          {lessonTitle}
        </AppText>
      </View>

      <Card>
        <Row label="Acertos" value={`${correct} de ${answers.length}`} />
        <View style={styles.rule} />
        {lesson ? (
          <>
            <Row
              label="Exercícios da lição acertados"
              value={`${lesson.completedExercises} de ${lesson.totalExercises}`}
            />
            <View style={styles.rule} />
          </>
        ) : null}
        <Row label="Nota do tópico" value={shownScore(last?.result.topic.score ?? null)} />
        <View style={styles.rule} />
        <Row
          label="Flashcards novos"
          value={newCards === 0 ? 'Nenhum' : plural(newCards, 'cartão', 'cartões')}
        />
      </Card>

      {lesson && !completed ? (
        <AppText variant="support" color="inkStrong">
          Acerte cada exercício da lição pelo menos uma vez para concluí-la. Você pode refazê-la.
        </AppText>
      ) : null}

      {last?.result.topic.status === 'mastered' ? (
        <AppText variant="support" color="masteredInk">
          Este tópico está dominado.
        </AppText>
      ) : null}
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={`${label}: ${value}`}>
      <AppText variant="body" color="inkStrong">
        {label}
      </AppText>
      <AppText variant="heading">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rule: { height: 1, backgroundColor: colors.line },
});
