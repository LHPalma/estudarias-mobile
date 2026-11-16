import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, Icon, Notice, Screen, TextField, type TextFieldRef } from '@/components';
import { authErrorMessage, useSession } from '@/session';
import { colors, minTouchTarget, spacing } from '@/theme';

export default function RegisterScreen() {
  const { signUp } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef<TextFieldRef>(null);
  const passwordRef = useRef<TextFieldRef>(null);

  async function submit() {
    if (submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // O cadastro já abre a sessão: o layout deste grupo leva para a trilha.
      await signUp(name.trim(), email.trim(), password);
    } catch (failure) {
      setError(authErrorMessage(failure));
      setSubmitting(false);
    }
  }

  return (
    <Screen
      edges={['top', 'left', 'right', 'bottom']}
      footer={<Button label="Criar conta e começar" onPress={submit} loading={submitting} />}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voltar para o login"
        onPress={() => router.back()}
        style={styles.back}
      >
        <Icon name="chevronLeft" color={colors.ink} strokeWidth={2.4} />
      </Pressable>

      <View style={styles.heading}>
        <AppText variant="display" accessibilityRole="header">
          Criar conta
        </AppText>
        <AppText color="inkSoft">
          Leva menos de um minuto. Você começa por Operações básicas.
        </AppText>
      </View>

      <TextField
        label="Nome"
        value={name}
        onChangeText={setName}
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <TextField
        ref={emailRef}
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
        hint="Mínimo de 8 caracteres, com maiúscula, minúscula, número e símbolo."
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      {error ? <Notice>{error}</Notice> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: {
    width: minTouchTarget,
    height: minTouchTarget,
    borderRadius: minTouchTarget / 2,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { gap: spacing.sm },
});
