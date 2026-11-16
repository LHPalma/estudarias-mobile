import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { ApiProvider } from '@/api';
import { createAppServices } from '@/services';
import { SessionProvider, useSession } from '@/session';
import { colors, fontAssets } from '@/theme';

// A splash fica até as fontes e a sessão estarem prontas, para nenhuma tela aparecer com a fonte do sistema nem o login
// piscar antes da trilha de quem já estava logado.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // A API e a sessão do app inteiro: as reais, ou o mock com EXPO_PUBLIC_API_MOCK=true.
  const [services] = useState(createAppServices);
  const [loaded, error] = useFonts(fontAssets);
  // Se a fonte falhar, o app segue com a do sistema em vez de travar na splash.
  const fontsReady = loaded || error !== null;

  return (
    <ApiProvider api={services.api}>
      <SessionProvider manager={services.session}>
        <StatusBar style="dark" />
        <RootStack fontsReady={fontsReady} />
      </SessionProvider>
    </ApiProvider>
  );
}

function RootStack({ fontsReady }: { fontsReady: boolean }) {
  const { state } = useSession();
  const ready = fontsReady && state.status !== 'loading';

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }}
    />
  );
}
