import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { renderRouter } from 'expo-router/testing-library';

import { MOCK_ACCOUNT } from '@/api/mock/mock-api';

/** Esvazia o cofre em memória: cada teste começa sem sessão guardada. */
export function resetDevice(): void {
  (SecureStore as unknown as { __reset(): void }).__reset();
}

/** Abre o app de verdade (o roteador sobre src/app, com o modo mock) na rota pedida. */
export async function openApp(initialUrl = '/') {
  return renderRouter('./src/app', { initialUrl });
}

/** Deixa uma sessão guardada no aparelho, como a de quem já tinha entrado antes: o app abre direto nas telas com sessão. */
export async function rememberSession(email = MOCK_ACCOUNT.email): Promise<void> {
  await SecureStore.setItemAsync('estudarias.refreshToken', `mock-refresh:${email}`);
}

/** Entra pela tela de login, como o aluno. */
export async function signIn(email = MOCK_ACCOUNT.email, password = MOCK_ACCOUNT.password) {
  await fireEvent.changeText(await screen.findByLabelText('E-mail'), email);
  await fireEvent.changeText(screen.getByLabelText('Senha'), password);
  await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
}

export async function expectPath(pathname: string) {
  await waitFor(() => expect(screen).toHavePathname(pathname));
}
