import { Pressable, StyleSheet, View } from 'react-native';

import type { Trail, TrailTopic } from '@/api';
import { AppText, Icon, TopicCard } from '@/components';
import { joinNames, lessonsSummary, plural } from '@/lib/format';
import { colors, fonts, minTouchTarget, radius, spacing } from '@/theme';

type Props = {
  trail: Trail;
  /** O nome do aluno, para a saudação; sem ele, a saudação não aparece. */
  studentName?: string;
  onOpenTopic: (topicId: string) => void;
  onOpenMap: () => void;
  onOpenReviews: () => void;
};

/** A trilha do aluno: o progresso geral, o aviso de revisões e os tópicos em ordem, ligados pela linha do caminho. */
export function TrailView({ trail, studentName, onOpenTopic, onOpenMap, onOpenReviews }: Props) {
  const names = new Map(trail.topics.map((topic) => [topic.id, topic.name]));
  // Quem ainda não respondeu nada não tem nota em nenhum tópico: a trilha aponta por onde começar.
  const untouched =
    trail.masteredTopics === 0 && trail.topics.every((topic) => topic.score === null);
  const first = untouched ? trail.topics.find((topic) => topic.status === 'available') : undefined;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AppText variant="support" color="inkSoft">
          {studentName ? `Olá, ${studentName}` : ' '}
        </AppText>
        <AppText variant="display" accessibilityRole="header">
          Matemática básica
        </AppText>
        <AppText variant="support" color="inkSoft">
          {trail.masteredTopics} de{' '}
          {plural(trail.totalTopics, 'tópico dominado', 'tópicos dominados')}
        </AppText>

        <View style={styles.progressRow}>
          <View
            style={styles.segments}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {trail.topics.map((topic) => (
              <View key={topic.id} style={styles.segment}>
                <View style={[styles.segmentFill, segmentFill(topic)]} />
              </View>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver o mapa da trilha"
            onPress={onOpenMap}
            style={styles.mapButton}
          >
            <Icon name="map" color={colors.ink} strokeWidth={2} />
            <AppText variant="label">Mapa</AppText>
          </Pressable>
        </View>
      </View>

      {first ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Comece por aqui: ${first.name}`}
          onPress={() => onOpenTopic(first.id)}
          style={styles.start}
        >
          <View style={styles.fill}>
            <AppText variant="overline" color="progressInk">
              Comece por aqui
            </AppText>
            <AppText variant="heading">{first.name}</AppText>
            <AppText variant="support" color="inkStrong">
              Leia a primeira lição e responda os exercícios para ganhar sua primeira nota.
            </AppText>
          </View>
          <Icon name="chevronRight" color={colors.progressInk} strokeWidth={2.4} />
        </Pressable>
      ) : null}

      {trail.dueReviews > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${plural(trail.dueReviews, 'flashcard', 'flashcards')} para revisar hoje`}
          onPress={onOpenReviews}
          style={styles.reviews}
        >
          <View style={styles.reviewsIcon}>
            <Icon name="cards" size={22} color={colors.onStrong} strokeWidth={2} />
          </View>
          <AppText variant="bodyStrong" color="progressInk" style={styles.reviewsText}>
            {plural(trail.dueReviews, 'flashcard', 'flashcards')} para revisar hoje
          </AppText>
          <Icon name="chevronRight" color={colors.progressInk} strokeWidth={2.4} />
        </Pressable>
      ) : null}

      <View>
        {trail.topics.map((topic, index) => {
          const last = index === trail.topics.length - 1;
          return (
            <View key={topic.id} style={styles.step}>
              <View style={styles.rail}>
                <Marker status={topic.status} number={index + 1} />
                {last ? null : (
                  <View
                    style={[
                      styles.line,
                      topic.status === 'mastered' ? styles.lineDone : styles.lineAhead,
                    ]}
                  />
                )}
              </View>
              <View style={styles.card}>
                <TopicCard
                  name={topic.name}
                  status={topic.status}
                  score={topic.score}
                  goal={trail.masteryThreshold}
                  detail={
                    topic.totalLessons > 0
                      ? lessonsSummary(topic.completedLessons, topic.totalLessons)
                      : undefined
                  }
                  requires={
                    topic.prerequisites.length > 0
                      ? `Requer ${joinNames(topic.prerequisites.map((id) => names.get(id) ?? ''))}`
                      : undefined
                  }
                  onPress={() => onOpenTopic(topic.id)}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function segmentFill(topic: TrailTopic) {
  if (topic.status === 'mastered') {
    return { width: '100%' as const, backgroundColor: colors.mastered };
  }
  if (topic.status === 'available' && topic.score !== null) {
    return { width: `${Math.min(100, topic.score)}%` as const, backgroundColor: colors.progress };
  }
  return { width: '0%' as const, backgroundColor: colors.line };
}

/** O marcador do tópico no caminho. O status não fica só na cor: dominado tem ✓, disponível tem número, bloqueado tem cadeado. */
function Marker({ status, number }: { status: TrailTopic['status']; number: number }) {
  if (status === 'mastered') {
    return (
      <View style={[styles.marker, { backgroundColor: colors.mastered }]}>
        <Icon name="check" color={colors.onStrong} strokeWidth={2.6} />
      </View>
    );
  }
  if (status === 'available') {
    return (
      <View style={[styles.marker, { backgroundColor: colors.progress }]}>
        <AppText style={styles.markerNumber}>{number}</AppText>
      </View>
    );
  }
  return (
    <View style={[styles.marker, styles.markerLocked]}>
      <Icon name="lock" size={18} color={colors.inkMuted} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xl - 4 },
  header: { gap: spacing.xs },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md + 2,
    marginTop: spacing.sm,
  },
  segments: { flex: 1, flexDirection: 'row', gap: 6 },
  segment: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.line,
    overflow: 'hidden',
  },
  segmentFill: { height: '100%' },
  mapButton: {
    minHeight: minTouchTarget,
    paddingLeft: spacing.md,
    paddingRight: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: minTouchTarget / 2,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  fill: { flex: 1, gap: spacing.xs },
  start: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.progress,
    backgroundColor: colors.surface,
  },
  reviews: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    paddingRight: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.progressSoft,
  },
  reviewsIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.progress,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewsText: { flex: 1, fontSize: 15 },
  step: { flexDirection: 'row', gap: spacing.md + 2 },
  rail: { width: 40, alignItems: 'center' },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerLocked: { backgroundColor: colors.muted, borderWidth: 1.5, borderColor: colors.lineStrong },
  markerNumber: { fontFamily: fonts.display, fontSize: 18, lineHeight: 22, color: colors.onStrong },
  line: { flex: 1, marginVertical: spacing.xs },
  lineDone: { width: 2, backgroundColor: colors.mastered },
  lineAhead: {
    width: 0,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.lineStrong,
  },
  card: { flex: 1, paddingBottom: spacing.md + 2 },
});
