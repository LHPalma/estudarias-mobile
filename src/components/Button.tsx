import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'success';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  /** Descreve o que acontece, quando o rótulo sozinho não basta para o leitor de tela. */
  accessibilityHint?: string;
};

const VARIANTS = {
  primary: {
    bg: colors.progress,
    pressed: colors.progressInk,
    border: colors.progress,
    text: 'onStrong',
  },
  secondary: { bg: colors.surface, pressed: colors.muted, border: colors.line, text: 'ink' },
  success: {
    bg: colors.mastered,
    pressed: colors.masteredInk,
    border: colors.mastered,
    text: 'onStrong',
  },
} as const;

/** O botão de ação. Desabilitado ou carregando, não responde ao toque e diz isso ao leitor de tela. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityHint,
}: Props) {
  const v = VARIANTS[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' ? styles.secondary : styles.strong,
        {
          backgroundColor: disabled ? colors.line : pressed ? v.pressed : v.bg,
          borderColor: disabled ? colors.line : v.border,
        },
      ]}
    >
      <View style={styles.content}>
        {loading ? <ActivityIndicator color={colors[v.text]} /> : null}
        <AppText variant="bodyStrong" color={disabled ? 'inkMuted' : v.text}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  strong: { minHeight: 56, borderWidth: 0 },
  secondary: { minHeight: 52, borderWidth: 1.5 },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
