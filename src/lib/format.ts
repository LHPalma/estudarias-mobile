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

/** As lições concluídas do tópico: "1 de 2 lições concluídas" (a API manda os dois números, o app só os escreve). */
export function lessonsSummary(completed: number, total: number): string {
  return `${completed} de ${total} ${total === 1 ? 'lição concluída' : 'lições concluídas'}`;
}

/** O estado de uma lição, em uma linha: o que o aluno já fez nela. */
export function lessonProgressLabel(
  status: 'notStarted' | 'inProgress' | 'completed',
  completedExercises: number,
  totalExercises: number,
): string {
  if (status === 'completed') {
    return 'Concluída';
  }
  if (status === 'inProgress') {
    return `${completedExercises} de ${plural(totalExercises, 'exercício acertado', 'exercícios acertados')}`;
  }
  return totalExercises === 0
    ? 'Sem exercícios'
    : plural(totalExercises, 'exercício', 'exercícios');
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
