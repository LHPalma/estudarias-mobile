import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing, type ColorName } from '@/theme';

import { AppText } from './AppText';

export type BadgeKind =
  'mastered' | 'inProgress' | 'available' | 'locked' | 'fromError' | 'easy' | 'medium' | 'hard';

const BADGES: Record<BadgeKind, { label: string; bg: string; text: ColorName }> = {
  mastered: { label: 'Dominado', bg: colors.masteredSoft, text: 'masteredInk' },
  inProgress: { label: 'Em andamento', bg: colors.progressSoft, text: 'progressInk' },
  available: { label: 'Disponível', bg: colors.progressSoft, text: 'progressInk' },
  locked: { label: 'Bloqueado', bg: colors.muted, text: 'inkStrong' },
  fromError: { label: 'Gerado por um erro seu', bg: colors.errorSoft, text: 'errorInk' },
  easy: { label: 'Fácil', bg: colors.masteredSoft, text: 'masteredInk' },
  medium: { label: 'Médio', bg: colors.progressSoft, text: 'progressInk' },
  hard: { label: 'Difícil', bg: colors.errorSoft, text: 'errorInk' },
};

/** Um selo de estado ou de dificuldade. O texto diz o estado; a cor só reforça. */
export function StatusBadge({ kind }: { kind: BadgeKind }) {
  const badge = BADGES[kind];

  return (
    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
      <AppText variant="label" color={badge.text} style={styles.text}>
        {badge.label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md - 2,
    paddingVertical: spacing.xs,
  },
  text: { fontSize: 13, lineHeight: 18 },
});
