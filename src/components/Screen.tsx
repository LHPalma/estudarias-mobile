import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

type Props = {
  children: ReactNode;
  /** Conteúdo que fica fixo embaixo, fora da rolagem (o botão principal da tela, ao alcance do polegar). */
  footer?: ReactNode;
  scroll?: boolean;
  background?: string;
  edges?: Edge[];
};

/** A moldura de toda tela: área segura, fundo de papel, rolagem opcional e um rodapé fixo para a ação principal. */
export function Screen({
  children,
  footer,
  scroll = true,
  background = colors.paper,
  edges = ['top', 'left', 'right'],
}: Props) {
  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: background }]}>
      {/* No iOS o teclado cobre a tela: o conteúdo e o rodapé sobem com ele. O Android já redimensiona a janela. */}
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.content, styles.fill]}>{children}</View>
        )}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.lg },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.paper,
  },
});
