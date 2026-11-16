import { router, useLocalSearchParams } from 'expo-router';

import { isApiError, useTopic } from '@/api';
import { ErrorState, Screen, Skeleton } from '@/components';
import { TopicView } from '@/features/topic/TopicView';

export default function TopicScreen() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const topic = useTopic(topicId);
  const toTrail = () => router.dismissTo('/trail');

  return (
    <Screen refreshing={topic.isRefetching} onRefresh={topic.refetch}>
      {topic.data ? (
        <TopicView
          topic={topic.data}
          onBack={() => (router.canGoBack() ? router.back() : toTrail())}
          onOpenLesson={(lessonId) =>
            router.push({ pathname: '/lessons/[lessonId]', params: { lessonId } })
          }
        />
      ) : topic.isError ? (
        <ErrorState
          error={topic.error}
          onRetry={topic.refetch}
          override={
            isApiError(topic.error, 'trail.topic.notFound')
              ? {
                  title: 'Tópico não encontrado',
                  message: 'Este tópico não faz mais parte da trilha.',
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
