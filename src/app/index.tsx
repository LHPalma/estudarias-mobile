import { Redirect } from 'expo-router';

// Sem sessão ainda (#5), o app abre sempre no login.
export default function Index() {
  return <Redirect href="/login" />;
}
