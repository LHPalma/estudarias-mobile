import { router } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { useTrail } from '@/api';
import { AppText, ErrorState, IconButton, Screen, Skeleton } from '@/components';
import { TrailMap } from '@/features/trail/TrailMap';
import { colors, spacing } from '@/theme';

export default function MapScreen() {
  const trail = useTrail();
  const { width } = useWindowDimensions();

  return (
    <Screen background={colors.ink} edges={['top', 'left', 'right']} padded={false}>
      <View style={styles.header}>
        <IconButton
          icon="chevronLeft"
          label="Voltar para a trilha"
          tone="dark"
          onPress={() => router.back()}
        />
        <AppText variant="title" color="paper" accessibilityRole="header">
          Mapa da trilha
        </AppText>
      </View>
      {trail.data ? (
        <TrailMap
          trail={trail.data}
          width={width}
          onOpenTopic={(topicId) =>
            router.push({ pathname: '/topics/[topicId]', params: { topicId } })
          }
        />
      ) : (
        <View style={styles.pad}>
          {trail.isError ? (
            <ErrorState error={trail.error} onRetry={trail.refetch} />
          ) : (
            <Skeleton />
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  pad: { padding: spacing.xl },
});
