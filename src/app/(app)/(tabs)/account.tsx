import { StyleSheet, View } from 'react-native';

import { useMe, useTrail } from '@/api';
import { AppText, Button, Card, ErrorState, Screen, Skeleton } from '@/components';
import { plural } from '@/lib/format';
import { useSession } from '@/session';
import { colors, fonts, radius, spacing } from '@/theme';

/** A conta de quem está logado: quem é, como está na trilha e a saída. */
export default function AccountScreen() {
  const { signOut } = useSession();
  const me = useMe();
  const trail = useTrail();

  if (!me.data) {
    return (
      <Screen>
        <Title />
        {me.isError ? <ErrorState error={me.error} onRetry={me.refetch} /> : <Skeleton />}
        <Button label="Sair da conta" variant="secondary" onPress={signOut} />
      </Screen>
    );
  }

  const { student, user } = me.data;
  const initial = student.name.trim().charAt(0).toUpperCase();

  return (
    <Screen refreshing={trail.isRefetching} onRefresh={trail.refetch}>
      <Title />

      <Card>
        <View style={styles.person}>
          <View style={styles.avatar} accessibilityElementsHidden>
            <AppText style={styles.initial}>{initial}</AppText>
          </View>
          <View style={styles.fill}>
            <AppText variant="heading">{student.name}</AppText>
            <AppText variant="support" color="inkStrong">
              {user.email}
            </AppText>
          </View>
        </View>
      </Card>

      {trail.data ? (
        <View style={styles.stats}>
          <Stat
            value={`${trail.data.masteredTopics} de ${trail.data.totalTopics}`}
            label={trail.data.totalTopics === 1 ? 'tópico dominado' : 'tópicos dominados'}
          />
          <Stat
            value={String(trail.data.dueReviews)}
            label={
              plural(trail.data.dueReviews, 'flashcard', 'flashcards').replace(/^\d+ /, '') +
              ' para revisar hoje'
            }
          />
        </View>
      ) : null}

      <Button label="Sair da conta" variant="secondary" onPress={signOut} />
    </Screen>
  );
}

function Title() {
  return (
    <AppText variant="display" accessibilityRole="header">
      Conta
    </AppText>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Card style={styles.stat}>
      <View accessible accessibilityLabel={`${value} ${label}`}>
        <AppText variant="title">{value}</AppText>
        <AppText variant="support" color="inkStrong">
          {label}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  person: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.progressSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28, color: colors.progressInk },
  stats: { flexDirection: 'row', gap: spacing.md },
  stat: { flex: 1 },
});
