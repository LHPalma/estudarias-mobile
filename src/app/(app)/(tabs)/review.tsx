import { StyleSheet, Text, View } from 'react-native';

export default function ReviewScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title} accessibilityRole="header">
        Revisão
      </Text>
      <Text style={styles.body}>A revisão de flashcards entra em #9.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, paddingTop: 64, gap: 8, backgroundColor: '#F4F1E8' },
  title: { fontSize: 32, fontWeight: '700', color: '#1A1916' },
  body: { fontSize: 16, color: '#5C5951' },
});
