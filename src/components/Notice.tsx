import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { AppText } from './AppText';

type Props = { children: string; tone?: 'error' | 'info' };

/** Um aviso dentro da tela, como o erro de um formulário. O leitor de tela o anuncia quando aparece. */
export function Notice({ children, tone = 'error' }: Props) {
  const error = tone === 'error';

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.notice, { backgroundColor: error ? colors.errorSoft : colors.progressSoft }]}
    >
      <AppText variant="label" color={error ? 'errorInk' : 'progressInk'}>
        {children}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: { borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
});
