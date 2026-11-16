import { Pressable, StyleSheet, View } from 'react-native';

import { speakMath } from '@/lib/math-markup';
import { colors, radius, spacing } from '@/theme';

import { AppText } from './AppText';
import { MathText } from './MathText';

export type AlternativeState = 'idle' | 'selected' | 'correct' | 'wrong' | 'dimmed';

type Props = {
  letter: string;
  /** O texto da alternativa, com a marcação de frações (`{5/6}`). */
  text: string;
  state: AlternativeState;
  onPress: () => void;
  /** Depois de responder, nenhuma alternativa troca mais. */
  disabled?: boolean;
};

const STATES = {
  idle: {
    bg: colors.surface,
    border: colors.line,
    width: 1.5,
    letterBg: colors.muted,
    letterText: 'inkStrong',
    text: 'ink',
  },
  selected: {
    bg: colors.progressSoft,
    border: colors.progress,
    width: 2,
    letterBg: colors.progress,
    letterText: 'onStrong',
    text: 'ink',
  },
  correct: {
    bg: colors.masteredSoft,
    border: colors.mastered,
    width: 2,
    letterBg: colors.mastered,
    letterText: 'onStrong',
    text: 'masteredInk',
  },
  wrong: {
    bg: colors.errorSoft,
    border: colors.error,
    width: 2,
    letterBg: colors.error,
    letterText: 'onStrong',
    text: 'errorInk',
  },
  dimmed: {
    bg: colors.surface,
    border: colors.line,
    width: 1.5,
    letterBg: colors.muted,
    letterText: 'inkMuted',
    text: 'inkSoft',
  },
} as const;

const SPOKEN_STATE: Record<AlternativeState, string> = {
  idle: '',
  selected: '',
  correct: ', correta',
  wrong: ', sua resposta, errada',
  dimmed: '',
};

/**
 * Uma alternativa de múltipla escolha. É um botão de rádio, e o leitor de tela ouve a letra, o valor ("Alternativa B: 5
 * sobre 6") e, depois de responder, se ela é a correta ou a resposta errada do aluno.
 */
export function AlternativeOption({ letter, text, state, onPress, disabled = false }: Props) {
  const s = STATES[state];

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: state === 'selected' || state === 'wrong', disabled }}
      accessibilityLabel={`Alternativa ${letter}: ${speakMath(text)}${SPOKEN_STATE[state]}`}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.option,
        { backgroundColor: s.bg, borderColor: s.border, borderWidth: s.width },
      ]}
    >
      <View style={[styles.letter, { backgroundColor: s.letterBg }]}>
        <AppText variant="label" color={s.letterText}>
          {letter}
        </AppText>
      </View>
      <MathText variant="title" color={s.text} fractionSize="lg" align="center">
        {text}
      </MathText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    minHeight: 112,
    borderRadius: radius.xl - 2,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  letter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
