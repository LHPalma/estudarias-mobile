import { Redirect } from 'expo-router';

import { useSession } from '@/session';

/** A entrada do app: quem tem sessão vai para a trilha; quem não tem, para o login. */
export default function Index() {
  const { state } = useSession();
  return <Redirect href={state.status === 'signedIn' ? '/trail' : '/login'} />;
}
