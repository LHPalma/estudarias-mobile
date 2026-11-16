import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Fraction,
  Notice,
  Screen,
  TextField,
  type TextFieldRef,
} from '@/components';
import { NOTICE_MESSAGES, authErrorMessage, useSession } from '@/session';
import { colors, radius, spacing } from '@/theme';

export default function LoginScreen() {
  const { state, signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const passwordRef = useRef<TextFieldRef>(null);

  const notice = state.status === 'signedOut' ? state.notice : null;

  async function submit() {
    if (submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // Com a sessão aberta, o layout deste grupo leva para a trilha.
      await signIn(email.trim(), password);
    } catch (failure) {
      setError(authErrorMessage(failure));
      setSubmitting(false);
    }
  }

  return (
    <Screen
      edges={['top', 'left', 'right', 'bottom']}
      footer={
        <>
          <Button label="Entrar" onPress={submit} loading={submitting} />
          <Button
            label="Ainda não tenho conta"
            variant="secondary"
            onPress={() => router.push('/register')}
          />
        </>
      }
    >
      <View style={styles.brand}>
        <View style={styles.logo} accessibilityElementsHidden importantForAccessibility="no">
          <Fraction numerator="e" denominator="%" size="md" color={colors.onStrong} />
        </View>
        <AppText variant="display" accessibilityRole="header">
          Estudarias
        </AppText>
        <AppText color="inkSoft">
          Descubra o tipo do seu erro e revise exatamente aquilo, no momento certo.
        </AppText>
      </View>

      {notice && !error ? <Notice tone="info">{NOTICE_MESSAGES[notice]}</Notice> : null}

      <TextField
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <TextField
        ref={passwordRef}
        label="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      {error ? <Notice>{error}</Notice> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { gap: spacing.sm, marginTop: spacing.xxl, marginBottom: spacing.sm },
  logo: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.progress,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
});
