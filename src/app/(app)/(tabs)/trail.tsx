import { router } from 'expo-router';

import { useMe, useTrail } from '@/api';
import { ErrorState, Screen, Skeleton } from '@/components';
import { TrailView } from '@/features/trail/TrailView';
import { useSession } from '@/session';

export default function TrailScreen() {
  const { signOut } = useSession();
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
          onSignOut={signOut}
        />
      ) : trail.isError ? (
        <ErrorState error={trail.error} onRetry={trail.refetch} />
      ) : (
        <Skeleton blocks={4} />
      )}
    </Screen>
  );
}
