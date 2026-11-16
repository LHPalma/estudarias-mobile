import { useLocalSearchParams } from 'expo-router';

import { useTopic } from '@/api';
import { AppText, Screen } from '@/components';

// A tela do tópico entra em #7; por ora, só mostra o nome, para a trilha e o mapa terem para onde levar.
export default function TopicScreen() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const topic = useTopic(topicId);

  return (
    <Screen>
      <AppText variant="display" accessibilityRole="header">
        {topic.data?.name ?? ' '}
      </AppText>
    </Screen>
  );
}
