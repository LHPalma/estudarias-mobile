import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { ApiProvider, createAppApi } from '@/api';
import { colors, fontAssets } from '@/theme';

// A splash fica até as fontes carregarem, para nenhuma tela aparecer com a fonte do sistema e trocar em seguida.
SplashScreen.preventAutoHideAsync();

// Um cliente da API para o app inteiro: o real, ou o mock com EXPO_PUBLIC_API_MOCK=true.
const api = createAppApi();

export default function RootLayout() {
  const [loaded, error] = useFonts(fontAssets);
  const ready = loaded || error !== null;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  // Se a fonte falhar, o app segue com a do sistema em vez de travar na splash.
  if (!ready) {
    return null;
  }

  return (
    <ApiProvider api={api}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }}
      />
    </ApiProvider>
  );
}
