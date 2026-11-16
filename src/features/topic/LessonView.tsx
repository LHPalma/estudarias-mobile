import { StyleSheet, View } from 'react-native';

import type { Lesson } from '@/api';
import { AppText, Card, IconButton, MathText } from '@/components';
import { isEquationLine } from '@/lib/math-markup';
import { spacing } from '@/theme';

type Props = { lesson: Lesson; onBack: () => void };

/**
 * O conteúdo da lição. Cada parágrafo do conteúdo (separado por uma linha em branco) vira um bloco; um parágrafo que é só
 * uma conta aparece em destaque, centralizado.
 */
export function LessonView({ lesson, onBack }: Props) {
  const paragraphs = lesson.content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  return (
    <View style={styles.root}>
      <IconButton icon="chevronLeft" label="Voltar para o tópico" onPress={onBack} />

      <View style={styles.heading}>
        <AppText variant="overline" color="progress">
          Lição {lesson.order}
        </AppText>
        <AppText variant="display" accessibilityRole="header">
          {lesson.title}
        </AppText>
      </View>

      {paragraphs.map((paragraph, index) =>
        isEquationLine(paragraph) ? (
          <Card key={index} style={styles.equation}>
            <MathText variant="title" fractionSize="md" align="center">
              {paragraph}
            </MathText>
          </Card>
        ) : (
          <MathText key={index} color="inkBody" fractionSize="sm">
            {paragraph}
          </MathText>
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.lg },
  heading: { gap: spacing.xs },
  equation: { alignItems: 'center', paddingVertical: spacing.lg },
});
