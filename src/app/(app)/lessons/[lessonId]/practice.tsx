import { Redirect, router, useLocalSearchParams } from 'expo-router';

import { isApiError, useLesson } from '@/api';
import { ErrorState, Screen, Skeleton } from '@/components';
import { PracticeFlow } from '@/features/practice/PracticeFlow';

export default function PracticeScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const lesson = useLesson(lessonId);
  const toTrail = () => router.dismissTo('/trail');

  if (lesson.data) {
    // Uma lição sem exercício não tem o que praticar: volta para o conteúdo.
    if (lesson.data.exercises.length === 0) {
      return <Redirect href={{ pathname: '/lessons/[lessonId]', params: { lessonId } }} />;
    }
    return (
      <PracticeFlow
        lesson={lesson.data}
        onExit={() => (router.canGoBack() ? router.back() : toTrail())}
        onSeeTrail={toTrail}
        onReview={() => router.dismissTo('/review')}
      />
    );
  }

  return (
    <Screen>
      {lesson.isError ? (
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
              : undefined
          }
        />
      ) : (
        <Skeleton />
      )}
    </Screen>
  );
}
