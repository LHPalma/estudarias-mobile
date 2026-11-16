import { Pressable, StyleSheet, View } from 'react-native';

import { hasLink, type TopicAttempt, type TopicDetail, type TopicStatus } from '@/api';
import { AppText, Card, Icon, IconButton, MathText, ScoreBar, StatusBadge } from '@/components';
import { joinNames, plural, shownScore } from '@/lib/format';
import { speakMath } from '@/lib/math-markup';
import { colors, radius, spacing } from '@/theme';

const STATUS_LABEL: Record<TopicStatus, string> = {
  mastered: 'Dominado',
  available: 'Disponível',
  locked: 'Bloqueado',
};
const STATUS_COLOR = {
  mastered: 'masteredInk',
  available: 'progress',
  locked: 'inkMuted',
} as const;

type Props = {
  topic: TopicDetail;
  /** As respostas que compõem a nota, da mais recente para a mais antiga. Sem elas, a seção não aparece. */
  attempts?: TopicAttempt[];
  onBack: () => void;
  onOpenLesson: (lessonId: string) => void;
};

/**
 * O tópico: a nota com a meta e o que falta para dominá-lo, e as lições. Um tópico bloqueado mostra os pré-requisitos que
 * faltam no lugar da nota. Uma lição só abre quando a API manda o link dela.
 */
export function TopicView({ topic, attempts = [], onBack, onOpenLesson }: Props) {
  const locked = topic.status === 'locked';

  return (
    <View style={styles.root}>
      <IconButton icon="chevronLeft" label="Voltar para a trilha" onPress={onBack} />

      <View style={styles.heading}>
        <AppText variant="overline" color={STATUS_COLOR[topic.status]}>
          {STATUS_LABEL[topic.status]}
        </AppText>
        <AppText variant="display" accessibilityRole="header">
          {topic.name}
        </AppText>
      </View>

      {locked ? (
        <Card tone="muted">
          <View style={styles.lockedTitle}>
            <Icon name="lock" color={colors.inkStrong} />
            <AppText variant="bodyStrong" color="inkStrong">
              Para liberar, domine:
            </AppText>
          </View>
          {topic.prerequisites.map((requisite) => (
            <View key={requisite.id} style={styles.requisite}>
              <AppText variant="bodyStrong" style={styles.fill}>
                {requisite.name}
              </AppText>
              <AppText variant="label" color={STATUS_COLOR[requisite.status]}>
                {STATUS_LABEL[requisite.status]}
              </AppText>
            </View>
          ))}
        </Card>
      ) : (
        <Card>
          <View style={styles.scoreRow}>
            <AppText variant="score" accessibilityLabel={`Nota ${shownScore(topic.score)}`}>
              {shownScore(topic.score)}
            </AppText>
            <AppText variant="support" color="inkSoft">
              Meta {topic.masteryThreshold}
            </AppText>
          </View>
          <ScoreBar
            score={topic.score}
            goal={topic.masteryThreshold}
            tone={topic.status === 'mastered' ? 'mastered' : 'progress'}
          />
          <AppText variant="support" color="inkStrong" style={styles.hint}>
            {masteryHint(topic)}
          </AppText>
          {topic.unlocks.length > 0 && topic.status !== 'mastered' ? (
            <AppText variant="support" color="inkSoft">
              Ao dominar, libera {joinNames(topic.unlocks.map((unlock) => unlock.name))}.
            </AppText>
          ) : null}
        </Card>
      )}

      <AppText variant="heading" accessibilityRole="header" style={styles.lessonsTitle}>
        Lições
      </AppText>
      <View style={styles.lessons}>
        {topic.lessons.map((lesson) => {
          const open = hasLink(lesson, 'lesson');
          return (
            <Pressable
              key={lesson.id}
              accessibilityRole="button"
              accessibilityLabel={`Lição ${lesson.order}: ${lesson.title}${open ? '' : ', bloqueada'}`}
              accessibilityState={{ disabled: !open }}
              disabled={!open}
              onPress={() => onOpenLesson(lesson.id)}
              style={[styles.lesson, open ? styles.lessonOpen : styles.lessonClosed]}
            >
              <View style={[styles.order, !open && styles.orderClosed]}>
                <AppText variant="label" color={open ? 'progressInk' : 'inkStrong'}>
                  {lesson.order}
                </AppText>
              </View>
              <AppText variant="bodyStrong" color={open ? 'ink' : 'inkStrong'} style={styles.fill}>
                {lesson.title}
              </AppText>
              {open ? (
                <Icon name="chevronRight" color={colors.inkSoft} strokeWidth={2.4} />
              ) : (
                <Icon name="lock" size={18} color={colors.inkMuted} />
              )}
            </Pressable>
          );
        })}
      </View>

      {attempts.length > 0 && !locked ? (
        <>
          <View style={styles.historyTitle}>
            <AppText variant="heading" accessibilityRole="header">
              Últimas respostas
            </AppText>
            <AppText variant="support" color="inkStrong">
              A nota vem destas respostas. As mais recentes e as mais difíceis pesam mais.
            </AppText>
          </View>
          <Card style={styles.history}>
            {attempts.map((attempt, index) => (
              <View
                key={attempt.attemptId}
                accessible
                accessibilityLabel={`${attempt.isCorrect ? 'Acertou' : 'Errou'}: ${speakMath(attempt.statement)}`}
                style={[styles.attempt, index > 0 && styles.attemptRule]}
              >
                <View
                  style={[
                    styles.result,
                    attempt.isCorrect ? styles.resultRight : styles.resultWrong,
                  ]}
                >
                  <Icon
                    name={attempt.isCorrect ? 'check' : 'close'}
                    size={16}
                    color={colors.onStrong}
                    strokeWidth={3}
                  />
                </View>
                <View style={styles.fill}>
                  <MathText variant="support" color="inkBody" fractionSize="sm">
                    {attempt.statement}
                  </MathText>
                </View>
                <StatusBadge kind={attempt.difficulty} />
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </View>
  );
}

/** O que falta para dominar, com os números que a API manda (a meta e o mínimo de respostas não ficam fixos no app). */
function masteryHint(topic: TopicDetail): string {
  if (topic.status === 'mastered') {
    return 'Tópico dominado. Ele continua dominado mesmo que a nota caia.';
  }
  if (topic.attemptCount === 0) {
    return 'Responda os exercícios das lições para ganhar sua primeira nota.';
  }
  if (topic.attemptCount < topic.minAttempts) {
    return `Para dominar: nota ${topic.masteryThreshold} ou mais e pelo menos ${plural(topic.minAttempts, 'exercício respondido', 'exercícios respondidos')}. Você respondeu ${topic.attemptCount}.`;
  }
  return `Para dominar: nota ${topic.masteryThreshold} ou mais. As respostas mais recentes e as mais difíceis pesam mais.`;
}

const styles = StyleSheet.create({
  root: { gap: spacing.lg },
  heading: { gap: spacing.xs },
  fill: { flex: 1 },
  lockedTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  requisite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  hint: { marginTop: spacing.xs },
  lessonsTitle: { marginTop: spacing.sm },
  lessons: { gap: spacing.sm + 2 },
  historyTitle: { gap: spacing.xs, marginTop: spacing.sm },
  history: { gap: 0, paddingVertical: spacing.xs },
  attempt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  attemptRule: { borderTopWidth: 1, borderTopColor: colors.line },
  result: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultRight: { backgroundColor: colors.mastered },
  resultWrong: { backgroundColor: colors.error },
  lesson: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  lessonOpen: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  lessonClosed: { backgroundColor: colors.muted },
  order: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.progressSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderClosed: { backgroundColor: colors.line },
});
