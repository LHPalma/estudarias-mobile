import { useMe } from '@/api';
import { AppText, Button, Screen } from '@/components';
import { useSession } from '@/session';

export default function TrailScreen() {
  const { signOut } = useSession();
  const me = useMe();

  return (
    <Screen>
      {me.data ? <AppText color="inkSoft">Olá, {me.data.student.name}</AppText> : null}
      <AppText variant="display" accessibilityRole="header">
        Trilha
      </AppText>
      <AppText color="inkSoft">A trilha entra em #6.</AppText>
      <Button label="Sair" variant="secondary" onPress={signOut} />
    </Screen>
  );
}
