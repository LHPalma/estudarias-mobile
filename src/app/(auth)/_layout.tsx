import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/session';
import { colors } from '@/theme';

/** As telas sem sessão. Quem já entrou não fica aqui: vai para a trilha (é o que acontece logo depois do login), ou para as boas-vindas se acabou de criar a conta. */
export default function AuthLayout() {
  const { state } = useSession();

  if (state.status === 'signedIn') {
    return <Redirect href={state.isNew ? '/welcome' : '/trail'} />;
  }

  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }}
    />
  );
}
