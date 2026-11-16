/** A nota como o aluno a vê: a parte inteira (a API já arredonda para baixo), ou um traço sem nenhuma resposta. */
export function shownScore(score: number | null): string {
  return score === null ? '–' : String(Math.floor(score));
}

/** Junta nomes em português: "A", "A e B", "A, B e C". */
export function joinNames(names: string[]): string {
  if (names.length <= 1) {
    return names[0] ?? '';
  }
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}

export function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Quando algo acontece, do jeito que se fala: "hoje", "amanhã" ou "em N dias". */
export function whenLabel(isoDate: string, now: Date = new Date()): string {
  const days = Math.round((new Date(isoDate).getTime() - now.getTime()) / DAY_MS);
  if (days <= 0) {
    return 'hoje';
  }
  return days === 1 ? 'amanhã' : `em ${days} dias`;
}
