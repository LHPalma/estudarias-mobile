import { router, useLocalSearchParams } from 'expo-router';

import { hasLink, isApiError, useTopic, useTopicAttempts } from '@/api';
import { ErrorState, Screen, Skeleton } from '@/components';
import { TopicView } from '@/features/topic/TopicView';

export default function TopicScreen() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const topic = useTopic(topicId);
  // O histórico só se busca quando a API oferece o link `attempts`: ela decide se o tópico pode ser praticado.
  const hasHistory = hasLink(topic.data, 'attempts');
  const attempts = useTopicAttempts(topicId, hasHistory);
  const toTrail = () => router.dismissTo('/trail');

  return (
    <Screen
      refreshing={topic.isRefetching}
      onRefresh={() => {
        topic.refetch();
        if (hasHistory) {
          attempts.refetch();
        }
      }}
    >
      {topic.data ? (
        <TopicView
          topic={topic.data}
          attempts={attempts.data?.items}
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
