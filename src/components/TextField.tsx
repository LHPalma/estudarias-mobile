import { useState, type ComponentRef, type Ref } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fonts, radius, spacing } from '@/theme';

import { AppText } from './AppText';

/** O que a `ref` do campo aponta: a entrada de texto, para dar o foco ao campo seguinte. */
export type TextFieldRef = ComponentRef<typeof TextInput>;

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  /** Uma dica sob o campo, como a regra da senha. */
  hint?: string;
  ref?: Ref<TextFieldRef>;
};

/** Um campo de texto com o rótulo visível em cima. O rótulo também é o nome do campo para o leitor de tela. */
export function TextField({ label, hint, ref, ...props }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityHint={hint}
        placeholderTextColor={colors.inkMuted}
        maxFontSizeMultiplier={2}
        {...props}
        onFocus={(event) => {
          setFocused(true);
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          props.onBlur?.(event);
        }}
        style={[styles.input, focused && styles.focused]}
      />
      {hint ? (
        <AppText variant="support" color="inkSoft">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs + 2 },
  input: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
  focused: { borderColor: colors.progress },
});
