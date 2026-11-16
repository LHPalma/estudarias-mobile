import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { useDueReviews, useReviewCard, type DueCard, type ReviewRating } from '@/api';
import {
  AppText,
  Button,
  Card,
  ErrorState,
  MathText,
  Notice,
  Screen,
  Skeleton,
  StatusBadge,
} from '@/components';
import { colors, minTouchTarget, radius, spacing, type ColorName } from '@/theme';

const RATINGS: {
  rating: ReviewRating;
  label: string;
  hint: string;
  bg: string;
  text: ColorName;
}[] = [
  { rating: 'again', label: 'Errei', hint: 'Volta logo', bg: colors.errorSoft, text: 'errorInk' },
  { rating: 'hard', label: 'Difícil', hint: 'Volta antes', bg: colors.muted, text: 'ink' },
  { rating: 'good', label: 'Bom', hint: 'No ritmo', bg: colors.progressSoft, text: 'progressInk' },
  {
    rating: 'easy',
    label: 'Fácil',
    hint: 'Volta depois',
    bg: colors.masteredSoft,
    text: 'masteredInk',
  },
];

type Props = { onBackToTrail: () => void };

/**
 * A revisão do dia: um cartão por vez, a pergunta, "Mostrar resposta" e a avaliação. Avaliar tira o cartão da fila na
 * hora (o useReviewCard é otimista); se o servidor recusar, o cartão volta e a tela avisa.
 */
export function ReviewDeck({ onBackToTrail }: Props) {
  const due = useDueReviews();
  const review = useReviewCard();
  const [shownId, setShownId] = useState<string | null>(null);

  const card = due.data?.items[0];
  const remaining = due.data?.items.length ?? 0;
  const revealed = card !== undefined && shownId === card.id;

  if (!due.data) {
    return (
      <Screen>
        <Title />
        {due.isError ? <ErrorState error={due.error} onRetry={due.refetch} /> : <Skeleton />}
      </Screen>
    );
  }

  if (!card) {
    return (
      <Screen refreshing={due.isRefetching} onRefresh={due.refetch}>
        <Title />
        <Card>
          <AppText variant="title" accessibilityRole="header">
            Tudo revisado por hoje
          </AppText>
          <AppText variant="support" color="inkStrong">
            Não há cartão para revisar agora. Os próximos aparecem aqui no dia certo.
          </AppText>
          <Button label="Voltar para a trilha" variant="secondary" onPress={onBackToTrail} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        revealed ? (
          <View style={styles.ratings}>
            {RATINGS.map(({ rating, label, hint, bg, text }) => (
              <Pressable
                key={rating}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityHint={hint}
                onPress={() => review.mutate({ cardId: card.id, rating })}
                style={({ pressed }) => [
                  styles.rating,
                  { backgroundColor: bg },
                  pressed && styles.pressed,
                ]}
              >
                <AppText variant="label" color={text}>
                  {label}
                </AppText>
              </Pressable>
            ))}
          </View>
        ) : (
          <Button
            label="Mostrar resposta"
            onPress={() => {
              review.reset();
              setShownId(card.id);
            }}
          />
        )
      }
    >
      <Title />
      <AppText variant="support" color="inkStrong" accessibilityLiveRegion="polite">
        {remaining === 1 ? 'Falta 1 cartão' : `Faltam ${remaining} cartões`}
      </AppText>
      {review.isError ? (
        <Notice>
          Não foi possível salvar a revisão. O cartão voltou para a fila; tente de novo.
        </Notice>
      ) : null}
      <FlipCard key={card.id} card={card} revealed={revealed} />
    </Screen>
  );
}

function Title() {
  return (
    <AppText variant="display" accessibilityRole="header">
      Revisão
    </AppText>
  );
}

/** O cartão. Ao revelar, gira no eixo vertical e mostra a resposta embaixo da pergunta. */
function FlipCard({ card, revealed }: { card: DueCard; revealed: boolean }) {
  const [turn] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (revealed) {
      turn.setValue(1);
      Animated.timing(turn, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [revealed, turn]);

  const rotateY = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });

  return (
    <Animated.View style={{ transform: [{ perspective: 1000 }, { rotateY }] }}>
      <Card style={styles.card}>
        <View style={styles.cardTop}>
          <AppText variant="overline" color="inkSoft" style={styles.fill}>
            {card.topic.name}
          </AppText>
          {card.fromError ? <StatusBadge kind="fromError" /> : null}
        </View>
        <MathText variant="title" fractionSize="lg">
          {card.question}
        </MathText>
        {revealed ? (
          <View style={styles.answer}>
            <AppText variant="overline" color="masteredInk">
              Resposta
            </AppText>
            <MathText color="inkBody">{card.answer}</MathText>
          </View>
        ) : null}
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  card: { minHeight: 260, gap: spacing.lg, paddingVertical: spacing.xl },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  answer: {
    gap: spacing.sm,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  ratings: { flexDirection: 'row', gap: spacing.sm },
  rating: {
    flex: 1,
    minHeight: minTouchTarget + 8,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
});
