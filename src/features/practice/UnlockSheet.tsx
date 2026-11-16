import { Modal, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { TopicRef } from '@/api';
import { AppText, Button, Icon } from '@/components';
import { joinNames } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';

type Props = {
  topics: TopicRef[];
  visible: boolean;
  onContinue: () => void;
  onSeeTrail: () => void;
};

/** A folha que sobe quando uma resposta domina o tópico e libera os seguintes. */
export function UnlockSheet({ topics, visible, onContinue, onSeeTrail }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onContinue}>
      <View style={styles.backdrop}>
        <View
          style={[styles.sheet, { paddingBottom: spacing.xl + insets.bottom }]}
          accessibilityViewIsModal
        >
          <View style={styles.badge}>
            <Icon name="check" size={28} color={colors.onStrong} strokeWidth={3} />
          </View>
          <AppText variant="overline" color="masteredInk">
            Tópico dominado
          </AppText>
          <AppText variant="display" accessibilityRole="header">
            Você liberou {joinNames(topics.map((topic) => topic.name))}
          </AppText>
          <AppText variant="support" color="inkStrong">
            {topics.length === 1
              ? 'O novo tópico já está aberto na trilha.'
              : 'Os novos tópicos já estão abertos na trilha.'}
          </AppText>
          <View style={styles.actions}>
            <Button label="Continuar a lição" onPress={onContinue} />
            <Button label="Ver na trilha" variant="secondary" onPress={onSeeTrail} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(26, 25, 22, 0.45)' },
  sheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.mastered,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
});
