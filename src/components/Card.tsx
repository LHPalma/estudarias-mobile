import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/theme';

type Props = {
  children: ReactNode;
  tone?: 'surface' | 'muted' | 'progress' | 'mastered' | 'error';
  style?: ViewStyle;
};

const TONES = {
  surface: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1 },
  muted: { backgroundColor: colors.muted, borderColor: colors.muted, borderWidth: 0 },
  progress: {
    backgroundColor: colors.progressSoft,
    borderColor: colors.progressSoft,
    borderWidth: 0,
  },
  mastered: {
    backgroundColor: colors.masteredSoft,
    borderColor: colors.masteredSoft,
    borderWidth: 0,
  },
  error: { backgroundColor: colors.errorSoft, borderColor: colors.errorSoft, borderWidth: 0 },
} as const;

/** Um bloco de conteúdo com fundo e cantos arredondados. */
export function Card({ children, tone = 'surface', style }: Props) {
  return <View style={[styles.card, TONES[tone], style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
});
