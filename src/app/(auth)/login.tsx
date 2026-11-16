import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function LoginScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title} accessibilityRole="header">
        Estudarias
      </Text>
      <Text style={styles.body}>A tela de login entra com a sessão (#5).</Text>
      <Link href="/trail" style={styles.link}>
        Entrar
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', padding: 24, gap: 12, backgroundColor: '#F4F1E8' },
  title: { fontSize: 32, fontWeight: '700', color: '#1A1916' },
  body: { fontSize: 16, color: '#5C5951' },
  link: { fontSize: 17, fontWeight: '600', color: '#2846C8', paddingVertical: 12 },
});
