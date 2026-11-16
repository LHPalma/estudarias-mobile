import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useApi } from './ApiProvider';
import type { AttemptRequest, DueReviews, ReviewRating } from './types';

export const queryKeys = {
  trail: ['trail'] as const,
  topic: (topicId: string) => ['topic', topicId] as const,
  lesson: (lessonId: string) => ['lesson', lessonId] as const,
  dueReviews: ['reviews', 'due'] as const,
};

export function useTrail() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.trail, queryFn: () => api.getTrail() });
}

export function useTopic(topicId: string) {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.topic(topicId), queryFn: () => api.getTopic(topicId) });
}

export function useLesson(lessonId: string) {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.lesson(lessonId), queryFn: () => api.getLesson(lessonId) });
}

export function useDueReviews() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.dueReviews, queryFn: () => api.getDueReviews() });
}

/** Responder muda a nota, o status dos tópicos e pode criar um cartão: a trilha, o tópico e as revisões ficam velhos. */
export function useSubmitAttempt(exerciseId: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AttemptRequest) => api.submitAttempt(exerciseId, request),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trail });
      queryClient.invalidateQueries({ queryKey: queryKeys.topic(result.topic.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dueReviews });
      result.unlockedTopics.forEach((topic) =>
        queryClient.invalidateQueries({ queryKey: queryKeys.topic(topic.id) }),
      );
    },
  });
}

/**
 * Revisar tira o cartão da lista na hora (atualização otimista), para o próximo aparecer sem esperar o servidor. Se o
 * servidor recusar, o cartão volta.
 */
export function useReviewCard() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cardId, rating }: { cardId: string; rating: ReviewRating }) =>
      api.reviewCard(cardId, { rating }),
    onMutate: async ({ cardId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dueReviews });
      const previous = queryClient.getQueryData<DueReviews>(queryKeys.dueReviews);
      if (previous) {
        const items = previous.items.filter((item) => item.id !== cardId);
        queryClient.setQueryData<DueReviews>(queryKeys.dueReviews, {
          ...previous,
          items,
          count: items.length,
        });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.dueReviews, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dueReviews });
      queryClient.invalidateQueries({ queryKey: queryKeys.trail });
    },
  });
}
