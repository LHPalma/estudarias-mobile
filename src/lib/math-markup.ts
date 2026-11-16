/**
 * A marcação de matemática do conteúdo: `{1/2}` é uma fração, o resto é texto. É a mesma marcação que o conteúdo do back
 * usa nas lições, nos enunciados, nos feedbacks e nos flashcards. Uma marcação malformada (`{1/}`, `{a b/2}`) continua como
 * texto: o aluno vê o que foi escrito, em vez de uma fração errada.
 */
export type MathSegment =
  { kind: 'text'; value: string } | { kind: 'fraction'; numerator: string; denominator: string };

const FRACTION = /\{\s*(-?[0-9A-Za-z]+)\s*\/\s*(-?[0-9A-Za-z]+)\s*\}/g;

export function parseMath(source: string): MathSegment[] {
  const segments: MathSegment[] = [];
  let last = 0;

  for (const match of source.matchAll(FRACTION)) {
    const start = match.index ?? 0;
    if (start > last) {
      segments.push({ kind: 'text', value: source.slice(last, start) });
    }

    segments.push({ kind: 'fraction', numerator: match[1], denominator: match[2] });
    last = start + match[0].length;
  }

  if (last < source.length) {
    segments.push({ kind: 'text', value: source.slice(last) });
  }

  return segments;
}

/** O texto que um leitor de tela lê: `{1/2}` vira "1 sobre 2". */
export function speakMath(source: string): string {
  return parseMath(source)
    .map((segment) =>
      segment.kind === 'text' ? segment.value : `${segment.numerator} sobre ${segment.denominator}`,
    )
    .join('');
}
