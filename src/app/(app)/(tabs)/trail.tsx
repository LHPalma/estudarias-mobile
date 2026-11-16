import { router } from 'expo-router';

import { useMe, useTrail } from '@/api';
import { ErrorState, Screen, Skeleton } from '@/components';
import { TrailView } from '@/features/trail/TrailView';

export default function TrailScreen() {
  const me = useMe();
  const trail = useTrail();

  return (
    <Screen refreshing={trail.isRefetching} onRefresh={trail.refetch}>
      {trail.data ? (
        <TrailView
          trail={trail.data}
          studentName={me.data?.student.name}
          onOpenTopic={(topicId) =>
            router.push({ pathname: '/topics/[topicId]', params: { topicId } })
          }
          onOpenMap={() => router.push('/map')}
          onOpenReviews={() => router.navigate('/review')}
        />
      ) : trail.isError ? (
        <ErrorState error={trail.error} onRetry={trail.refetch} />
      ) : (
        <Skeleton blocks={4} />
      )}
    </Screen>
  );
}
