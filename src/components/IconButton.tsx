import { Pressable, StyleSheet } from 'react-native';

import { colors, minTouchTarget } from '@/theme';

import { Icon, type IconName } from './Icon';

type Props = {
  icon: IconName;
  /** O que o botão faz: é o nome dele para o leitor de tela, já que não tem texto. */
  label: string;
  onPress: () => void;
  tone?: 'light' | 'dark';
};

/** Um botão redondo só com ícone, como o de voltar. */
export function IconButton({ icon, label, onPress, tone = 'light' }: Props) {
  const dark = tone === 'dark';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={[styles.button, dark ? styles.dark : styles.light]}
    >
      <Icon name={icon} color={dark ? colors.paper : colors.ink} strokeWidth={2.4} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: minTouchTarget,
    height: minTouchTarget,
    borderRadius: minTouchTarget / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  light: { borderColor: colors.line, backgroundColor: colors.surface },
  dark: { borderColor: colors.inkStrong, backgroundColor: colors.inkBody },
});
