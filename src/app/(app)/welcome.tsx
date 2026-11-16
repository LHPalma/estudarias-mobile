import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useMe } from '@/api';
import { AppText, Button, Icon, Screen, type IconName } from '@/components';
import { colors, radius, spacing } from '@/theme';

const STEPS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'trail',
    title: 'Siga a trilha',
    text: 'Os tópicos vêm em ordem. Dominar um libera os seguintes.',
  },
  {
    icon: 'check',
    title: 'Pratique',
    text: 'Cada lição tem exercícios. Quando você erra, o app mostra onde foi o erro.',
  },
  {
    icon: 'cards',
    title: 'Revise',
    text: 'Os erros viram flashcards, que voltam na hora certa para você não esquecer.',
  },
];

/** As boas-vindas de quem acabou de criar a conta: o app em três passos, e a trilha. */
export default function WelcomeScreen() {
  const me = useMe();
  const name = me.data?.student.name.trim().split(/\s+/)[0];

  return (
    <Screen
      edges={['top', 'left', 'right', 'bottom']}
      footer={<Button label="Começar" onPress={() => router.replace('/trail')} />}
    >
      <View style={styles.heading}>
        <AppText variant="overline" color="progress">
          Conta criada
        </AppText>
        <AppText variant="display" accessibilityRole="header">
          {name ? `Boas-vindas, ${name}` : 'Boas-vindas'}
        </AppText>
        <AppText color="inkStrong">O Estudarias funciona assim:</AppText>
      </View>

      <View style={styles.steps}>
        {STEPS.map((step) => (
          <View key={step.title} style={styles.step}>
            <View style={styles.icon}>
              <Icon name={step.icon} size={22} color={colors.progressInk} strokeWidth={2.2} />
            </View>
            <View style={styles.fill}>
              <AppText variant="heading">{step.title}</AppText>
              <AppText variant="support" color="inkStrong">
                {step.text}
              </AppText>
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, gap: spacing.xs },
  heading: { gap: spacing.xs },
  steps: { gap: spacing.md, marginTop: spacing.sm },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.progressSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
