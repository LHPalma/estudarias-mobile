import { Redirect } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AlternativeOption,
  AppText,
  Button,
  Card,
  Fraction,
  MathText,
  ScoreBar,
  Screen,
  StatusBadge,
  TopicCard,
  type AlternativeState,
} from '@/components';
import { colors, spacing } from '@/theme';

const SWATCHES = [
  'paper',
  'surface',
  'line',
  'muted',
  'ink',
  'inkSoft',
  'progress',
  'progressSoft',
  'mastered',
  'masteredSoft',
  'error',
  'errorSoft',
] as const;

const ALTERNATIVE_STATES: AlternativeState[] = ['idle', 'selected', 'correct', 'wrong'];

/**
 * A galeria dos componentes, para conferir contra a folha "Tokens e componentes" do canvas. Só existe em desenvolvimento:
 * no build de produção, a rota manda para o início.
 */
export default function ComponentsGallery() {
  const [chosen, setChosen] = useState<number | null>(null);

  if (!__DEV__) {
    return <Redirect href="/" />;
  }

  return (
    <Screen>
      <AppText variant="display" accessibilityRole="header">
        Componentes
      </AppText>

      <AppText variant="title">Cores</AppText>
      <View style={styles.swatches}>
        {SWATCHES.map((name) => (
          <View key={name} style={styles.swatch}>
            <View style={[styles.swatchColor, { backgroundColor: colors[name] }]} />
            <AppText variant="support">{name}</AppText>
          </View>
        ))}
      </View>

      <AppText variant="title">Texto</AppText>
      <Card>
        <AppText variant="display">Matemática básica</AppText>
        <AppText variant="title">Soma de numeradores e denominadores</AppText>
        <AppText variant="body">Antes de somar, reescreva as duas frações.</AppText>
        <AppText variant="support" color="inkSoft">
          Nota 54 · Meta 70
        </AppText>
        <AppText variant="overline" color="progress">
          Em andamento
        </AppText>
      </Card>

      <AppText variant="title">Botões e selos</AppText>
      <Button label="Responder" onPress={() => {}} />
      <Button label="Voltar para a trilha" variant="secondary" onPress={() => {}} />
      <Button label="Continuar" variant="success" onPress={() => {}} />
      <Button label="Responder" disabled onPress={() => {}} />
      <Button label="Entrando" loading onPress={() => {}} />
      <View style={styles.row}>
        <StatusBadge kind="mastered" />
        <StatusBadge kind="inProgress" />
        <StatusBadge kind="locked" />
        <StatusBadge kind="fromError" />
        <StatusBadge kind="easy" />
        <StatusBadge kind="medium" />
        <StatusBadge kind="hard" />
      </View>

      <AppText variant="title">Frações e nota</AppText>
      <Card>
        <View style={styles.row}>
          <Fraction numerator={5} denominator={6} size="lg" />
          <Fraction numerator={11} denominator={12} size="md" />
          <Fraction numerator={3} denominator={4} size="sm" />
        </View>
        <MathText variant="title">{'Quanto é {1/2} + {1/3}?'}</MathText>
        <MathText>
          {'Só se somam numeradores com o mesmo denominador: {3/6} + {2/6} = {5/6}.'}
        </MathText>
      </Card>
      <Card>
        <AppText variant="score">54</AppText>
        <ScoreBar score={54} />
        <ScoreBar score={null} />
        <ScoreBar score={86} tone="mastered" />
      </Card>

      <AppText variant="title">Alternativas</AppText>
      <View style={styles.grid}>
        {['{2/5}', '{5/6}', '{2/6}', '{1/6}'].map((text, index) => (
          <View key={text} style={styles.cell}>
            <AlternativeOption
              letter={String.fromCharCode(65 + index)}
              text={text}
              state={chosen === index ? 'selected' : 'idle'}
              onPress={() => setChosen(index)}
            />
          </View>
        ))}
      </View>
      <View style={styles.grid}>
        {ALTERNATIVE_STATES.map((state, index) => (
          <View key={state} style={styles.cell}>
            <AlternativeOption
              letter={String.fromCharCode(65 + index)}
              text="{5/6}"
              state={state}
              onPress={() => {}}
              disabled
            />
          </View>
        ))}
      </View>

      <AppText variant="title">Tópicos</AppText>
      <TopicCard name="Operações básicas" status="mastered" score={86} onPress={() => {}} />
      <TopicCard name="Frações" status="available" score={54} onPress={() => {}} />
      <TopicCard name="Equações do 1º grau" status="available" score={null} onPress={() => {}} />
      <TopicCard
        name="Porcentagem"
        status="locked"
        score={null}
        requires="Requer Frações e Equações do 1º grau"
        onPress={() => {}}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  swatch: { width: 96, gap: spacing.xs },
  swatchColor: { height: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.line },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  cell: { width: '47%' },
});
