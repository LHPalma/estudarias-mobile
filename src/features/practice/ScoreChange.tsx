import { AppText } from '@/components';
import { shownScore } from '@/lib/format';
import type { ColorName } from '@/theme';

type Props = { from: number | null; to: number | null; color?: ColorName };

/** "Nota 37 → 42": quanto a resposta mexeu na nota do tópico. Sem nota anterior (ou sem mudança visível), só a nota. */
export function ScoreChange({ from, to, color = 'ink' }: Props) {
  const before = shownScore(from);
  const after = shownScore(to);
  const changed = from !== null && before !== after;

  return (
    <AppText
      variant="bodyStrong"
      color={color}
      accessibilityLabel={changed ? `Nota: de ${before} para ${after}` : `Nota: ${after}`}
    >
      {changed ? `Nota ${before} → ${after}` : `Nota ${after}`}
    </AppText>
  );
}
