import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

/** O esqueleto de uma tela enquanto os dados chegam: blocos no lugar do conteúdo, sem spinner. */
export function Skeleton({ blocks = 3 }: { blocks?: number }) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando"
      style={styles.root}
    >
      <View style={styles.title} />
      {Array.from({ length: blocks }, (_, index) => (
        <View key={index} style={styles.block} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  title: { height: 28, width: '60%', borderRadius: radius.sm, backgroundColor: colors.muted },
  block: { height: 88, borderRadius: radius.lg, backgroundColor: colors.muted },
});
