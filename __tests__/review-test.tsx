import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ApiProvider, type ApiClient, type ReviewRequest } from '@/api';
import { createMockApi } from '@/api/mock/mock-api';
import { ReviewDeck } from '@/features/review/ReviewDeck';
import { expectPath, openApp, rememberSession, resetDevice } from 'test-utils/app';

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};
const ERROR_CARD = 'Por que 1 sobre 2 + 1 sobre 3 não é 2 sobre 5?';
const MANUAL_CARD = 'Quanto é 7 × 8?';

const reveal = async () =>
  fireEvent.press(await screen.findByRole('button', { name: 'Mostrar resposta' }));
const rate = async (label: string) => fireEvent.press(screen.getByRole('button', { name: label }));

async function renderDeck(api: ApiClient) {
  const onBackToTrail = jest.fn();
  await render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <ApiProvider api={api}>
        <ReviewDeck onBackToTrail={onBackToTrail} />
      </ApiProvider>
    </SafeAreaProvider>,
  );
  return { onBackToTrail };
}

beforeEach(async () => {
  resetDevice();
  await rememberSession();
});

describe('revisão', () => {
  it('mostra o primeiro cartão com o tópico, o selo de erro e quantos faltam', async () => {
    // Act
    await openApp('/review');

    // Assert
    expect(await screen.findByLabelText(ERROR_CARD)).toBeTruthy();
    expect(screen.getByText('Faltam 2 cartões')).toBeTruthy();
    expect(screen.getByText('Frações')).toBeTruthy();
    expect(screen.getByText('Gerado por um erro seu')).toBeTruthy();
    expect(screen.queryByText('Resposta')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Bom' })).toBeNull();
  });

  it('virar mostra a resposta e os quatro botões de avaliação', async () => {
    // Arrange
    await openApp('/review');

    // Act
    await reveal();

    // Assert
    expect(screen.getByText('Resposta')).toBeTruthy();
    expect(screen.getByLabelText(/^Só se somam numeradores com o mesmo denominador/)).toBeTruthy();
    for (const label of ['Errei', 'Difícil', 'Bom', 'Fácil']) {
      expect(screen.getByRole('button', { name: label })).toBeTruthy();
    }
    expect(screen.queryByRole('button', { name: 'Mostrar resposta' })).toBeNull();
  });

  it('avaliar passa ao próximo cartão, fechado, e manda a avaliação escolhida', async () => {
    // Arrange
    const mock = createMockApi();
    const sent: ReviewRequest[] = [];
    await renderDeck({
      ...mock,
      reviewCard: (cardId, request) => {
        sent.push(request);
        return mock.reviewCard(cardId, request);
      },
    });
    await reveal();

    // Act
    await rate('Difícil');

    // Assert
    expect(await screen.findByLabelText(MANUAL_CARD)).toBeTruthy();
    expect(screen.getByText('Falta 1 cartão')).toBeTruthy();
    expect(screen.queryByText('Gerado por um erro seu')).toBeNull();
    expect(screen.getByRole('button', { name: 'Mostrar resposta' })).toBeTruthy();
    expect(sent).toEqual([{ rating: 'hard' }]);
  });

  it('o último cartão leva ao estado vazio, e a trilha deixa de avisar da revisão', async () => {
    // Arrange
    await openApp('/review');
    await reveal();
    await rate('Bom');
    await screen.findByLabelText(MANUAL_CARD);
    await reveal();

    // Act
    await rate('Fácil');

    // Assert
    expect(await screen.findByRole('header', { name: 'Tudo revisado por hoje' })).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Voltar para a trilha' }));
    await expectPath('/trail');
    await waitFor(() => expect(screen.queryByText(/para revisar hoje/)).toBeNull());
  });

  it('se o servidor recusa, o cartão volta para a fila e a tela avisa', async () => {
    // Arrange
    await renderDeck({
      ...createMockApi(),
      reviewCard: () => Promise.reject(new Error('sem rede')),
    });
    await reveal();

    // Act
    await rate('Bom');

    // Assert
    expect(await screen.findByText(/Não foi possível salvar a revisão/)).toBeTruthy();
    expect(screen.getByLabelText(ERROR_CARD)).toBeTruthy();
    expect(screen.getByText('Faltam 2 cartões')).toBeTruthy();
  });
});
