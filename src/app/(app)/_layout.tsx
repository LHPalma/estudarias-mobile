import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/session';
import { colors } from '@/theme';

/** As telas com sessão. Sem sessão (nunca entrou, saiu ou a sessão expirou), o aluno vai para o login. */
export default function AppLayout() {
  const { state } = useSession();

  if (state.status !== 'signedIn') {
    return <Redirect href="/login" />;
  }

  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }}
    />
  );
}
