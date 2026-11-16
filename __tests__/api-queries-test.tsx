import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ApiProvider, createQueryClient } from '@/api/ApiProvider';
import type { ApiClient } from '@/api/client';
import { ApiError } from '@/api/errors';
import { createMockApi } from '@/api/mock/mock-api';
import { useDueReviews, useReviewCard, useSubmitAttempt, useTrail } from '@/api/queries';

const EX_HALF_PLUS_THIRD = '0192f0c4-0004-7000-8000-000000000003';
const ALT_CORRECT = '0192f0c4-0005-7000-8000-000000000010';

function wrapperFor(api: ApiClient) {
  const queryClient = createQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ApiProvider api={api} queryClient={queryClient}>
        {children}
      </ApiProvider>
    );
  };
}

describe('hooks da API', () => {
  it('useTrail traz a trilha', async () => {
    // Arrange & Act
    const { result } = await renderHook(() => useTrail(), { wrapper: wrapperFor(createMockApi()) });

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.topics).toHaveLength(4);
  });

  it('responder atualiza a nota que a trilha mostra', async () => {
    // Arrange
    const wrapper = wrapperFor(createMockApi());
    const { result } = await renderHook(
      () => ({ trail: useTrail(), submit: useSubmitAttempt(EX_HALF_PLUS_THIRD) }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.trail.isSuccess).toBe(true));
    const before = result.current.trail.data?.topics[1].score;

    // Act
    await act(() => result.current.submit.mutateAsync({ alternativeId: ALT_CORRECT }));

    // Assert
    await waitFor(() => expect(result.current.trail.data?.topics[1].score).not.toBe(before));
  });

  it('revisar tira o cartão na hora e o devolve se o servidor recusar', async () => {
    // Arrange
    const base = createMockApi();
    let release: (() => void) | undefined;
    const failing: ApiClient = {
      ...base,
      reviewCard: () =>
        new Promise((_resolve, reject) => {
          release = () => reject(new ApiError(500, null, 'HTTP 500'));
        }),
    };
    const { result } = await renderHook(() => ({ due: useDueReviews(), review: useReviewCard() }), {
      wrapper: wrapperFor(failing),
    });
    await waitFor(() => expect(result.current.due.isSuccess).toBe(true));
    const firstId = result.current.due.data!.items[0].id;

    // Act
    act(() => result.current.review.mutate({ cardId: firstId, rating: 'good' }));

    // Assert: some na hora...
    await waitFor(() =>
      expect(result.current.due.data?.items.map((item) => item.id)).not.toContain(firstId),
    );
    // ...e volta quando o servidor recusa.
    act(() => release?.());
    await waitFor(() =>
      expect(result.current.due.data?.items.map((item) => item.id)).toContain(firstId),
    );
  });
});
