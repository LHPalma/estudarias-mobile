import { router, useLocalSearchParams } from 'expo-router';

import { hasLink, isApiError, useLesson } from '@/api';
import { Button, ErrorState, Screen, Skeleton } from '@/components';
import { LessonView } from '@/features/topic/LessonView';
import { plural } from '@/lib/format';

export default function LessonScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const lesson = useLesson(lessonId);
  const toTrail = () => router.dismissTo('/trail');

  // "Praticar" só aparece se há exercício e a API deixa responder (o link `answer`).
  const exercises = lesson.data?.exercises ?? [];
  const canPractice = exercises.length > 0 && exercises.every((e) => hasLink(e, 'answer'));

  return (
    <Screen
      edges={['top', 'left', 'right', 'bottom']}
      footer={
        canPractice ? (
          <Button
            label={`Praticar · ${plural(exercises.length, 'exercício', 'exercícios')}`}
            onPress={() =>
              router.push({ pathname: '/lessons/[lessonId]/practice', params: { lessonId } })
            }
          />
        ) : undefined
      }
    >
      {lesson.data ? (
        <LessonView
          lesson={lesson.data}
          onBack={() => (router.canGoBack() ? router.back() : toTrail())}
        />
      ) : lesson.isError ? (
        <ErrorState
          error={lesson.error}
          onRetry={lesson.refetch}
          override={
            isApiError(lesson.error, 'student.topic.locked')
              ? {
                  title: 'Lição bloqueada',
                  message: 'Esta lição é de um tópico que você ainda não liberou.',
                  actionLabel: 'Voltar para a trilha',
                  onAction: toTrail,
                }
              : isApiError(lesson.error, 'trail.lesson.notFound')
                ? {
                    title: 'Lição não encontrada',
                    message: 'Esta lição não faz mais parte da trilha.',
                    actionLabel: 'Voltar para a trilha',
                    onAction: toTrail,
                  }
                : undefined
          }
        />
      ) : (
        <Skeleton />
      )}
    </Screen>
  );
}
