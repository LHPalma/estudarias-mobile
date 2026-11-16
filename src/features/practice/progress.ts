import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import type { AttemptResult } from '@/api';

export type Answered = {
  exerciseId: string;
  /** A alternativa que o aluno escolheu. */
  chosenId: string;
  result: AttemptResult;
  /** A nota do tópico antes desta resposta, para mostrar a variação. */
  previousScore: number | null;
};

export type PracticeProgress = {
  /** As respostas desta sessão, na ordem dos exercícios da lição. */
  answers: Answered[];
  /** Quantas respostas já tiveram o retorno visto ("Continuar"). O exercício atual é o desta posição. */
  seen: number;
  /** Se a folha de desbloqueio da resposta atual já foi fechada. */
  unlockSeen: boolean;
};

const EMPTY: PracticeProgress = { answers: [], seen: 0, unlockSeen: false };

/**
 * O andamento da prática de uma lição nesta sessão. Fica no cache do TanStack Query, fora da tela: sair no meio e voltar
 * retoma do mesmo ponto, e sair da conta (que esvazia o cache) apaga tudo. Cada resposta já está gravada no servidor; isto
 * guarda só o que a tela precisa para continuar.
 */
export function usePracticeProgress(lessonId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['practice', lessonId] as const;

  const { data } = useQuery({
    queryKey,
    queryFn: () => EMPTY,
    initialData: EMPTY,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const update = useCallback(
    (change: (progress: PracticeProgress) => PracticeProgress) => {
      queryClient.setQueryData<PracticeProgress>(['practice', lessonId], (progress) =>
        change(progress ?? EMPTY),
      );
    },
    [queryClient, lessonId],
  );

  const reset = useCallback(() => update(() => EMPTY), [update]);

  return { progress: data, update, reset };
}
