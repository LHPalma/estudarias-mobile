import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ApiProvider, type ApiClient, type AttemptRequest, type Lesson } from '@/api';
import { createMockApi } from '@/api/mock/mock-api';
import { PracticeFlow } from '@/features/practice/PracticeFlow';
import { whenLabel } from '@/lib/format';
import { expectPath, openApp, rememberSession, resetDevice } from 'test-utils/app';

const FRACTIONS = '0192f0c4-0001-7000-8000-000000000002';
const LESSON = '0192f0c4-0003-7000-8000-000000000003';
const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};
const PRACTICE = `/lessons/${LESSON}/practice`;

const answer = async (alternative: string) => {
  await fireEvent.press(await screen.findByRole('radio', { name: alternative }));
  await fireEvent.press(screen.getByRole('button', { name: 'Responder' }));
};
const proceed = async () =>
  fireEvent.press(await screen.findByRole('button', { name: 'Continuar' }));

/** Monta só o fluxo de prática sobre uma API escolhida pelo teste (outro grupo, uma resposta que libera tópicos). */
async function renderFlow(api: ApiClient) {
  const lesson: Lesson = await api.getLesson(LESSON);
  const handlers = { onExit: jest.fn(), onSeeTrail: jest.fn(), onReview: jest.fn() };
  await render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <ApiProvider api={api}>
        <PracticeFlow lesson={lesson} {...handlers} />
      </ApiProvider>
    </SafeAreaProvider>,
  );
  return handlers;
}

beforeEach(async () => {
  resetDevice();
  await rememberSession();
});

describe('exercício', () => {
  it('"Responder" só habilita com uma alternativa escolhida', async () => {
    // Arrange
    await openApp(PRACTICE);
    expect(await screen.findByLabelText('Quanto é 1 sobre 2 + 1 sobre 3?')).toBeTruthy();
    expect(screen.getByLabelText('Exercício 1 de 3')).toBeTruthy();
    expect(screen.getByText('Fácil')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Responder' })).toBeDisabled();

    // Act
    await fireEvent.press(screen.getByRole('radio', { name: 'Alternativa B: 5 sobre 6' }));

    // Assert
    expect(screen.getByRole('button', { name: 'Responder' })).toBeEnabled();
  });

  it('o acerto mostra a faixa verde com a variação da nota e segue para o próximo', async () => {
    // Arrange
    await openApp(`/topics/${FRACTIONS}`);
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Lição 2: Soma com denominadores diferentes' }),
    );
    await fireEvent.press(await screen.findByRole('button', { name: 'Praticar · 3 exercícios' }));

    // Act
    await answer('Alternativa B: 5 sobre 6');

    // Assert
    expect(await screen.findByText('Resposta certa')).toBeTruthy();
    expect(screen.getByLabelText(/^Nota: de 37 para \d+$/)).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Alternativa B: 5 sobre 6, correta' })).toBeDisabled();

    await proceed();
    expect(await screen.findByLabelText('Exercício 2 de 3')).toBeTruthy();
    expect(screen.getByLabelText('Quanto é 2 sobre 3 + 1 sobre 6?')).toBeTruthy();
  });

  it('manda o tempo de resposta junto com a alternativa', async () => {
    // Arrange
    const mock = createMockApi();
    const sent: AttemptRequest[] = [];
    await renderFlow({
      ...mock,
      submitAttempt: (exerciseId, request) => {
        sent.push(request);
        return mock.submitAttempt(exerciseId, request);
      },
    });

    // Act
    await answer('Alternativa B: 5 sobre 6');

    // Assert
    await screen.findByText('Resposta certa');
    expect(sent).toEqual([
      {
        alternativeId: '0192f0c4-0005-7000-8000-000000000010',
        responseSeconds: expect.any(Number),
      },
    ]);
    expect(sent[0].responseSeconds).toBeGreaterThanOrEqual(0);
  });

  it('se o envio falha, avisa e deixa tentar de novo', async () => {
    // Arrange
    const mock = createMockApi();
    let fail = true;
    await renderFlow({
      ...mock,
      submitAttempt: (exerciseId, request) =>
        fail ? Promise.reject(new Error('sem rede')) : mock.submitAttempt(exerciseId, request),
    });

    // Act
    await answer('Alternativa B: 5 sobre 6');

    // Assert
    expect(await screen.findByText(/Não foi possível enviar a resposta/)).toBeTruthy();
    fail = false;
    await fireEvent.press(screen.getByRole('button', { name: 'Responder' }));
    expect(await screen.findByText('Resposta certa')).toBeTruthy();
  });
});

describe('erro', () => {
  it('com diagnóstico: explica o tipo de erro e avisa que o flashcard dele já existe', async () => {
    // Arrange
    await openApp(PRACTICE);

    // Act
    await answer('Alternativa A: 2 sobre 5');

    // Assert
    expect(await screen.findByRole('header', { name: 'Vamos entender o erro' })).toBeTruthy();
    expect(screen.getByText('Sua resposta')).toBeTruthy();
    expect(screen.getByText('Resposta correta')).toBeTruthy();
    expect(screen.getAllByLabelText('2 sobre 5').length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('5 sobre 6').length).toBeGreaterThan(0);
    expect(screen.getByText('Soma de numeradores e denominadores')).toBeTruthy();
    expect(screen.getByText('Você já tem um flashcard deste erro na sua revisão.')).toBeTruthy();
  });

  it('um tipo de erro novo cria um flashcard, e a tela diz quando ele entra na revisão', async () => {
    // Arrange
    await openApp(PRACTICE);

    // Act
    await answer('Alternativa C: 2 sobre 6');

    // Assert
    expect(await screen.findByText('Trocou o denominador sem converter o numerador')).toBeTruthy();
    expect(
      screen.getByText('Criamos um flashcard deste erro. Ele entra na sua revisão amanhã.'),
    ).toBeTruthy();
  });

  it('sem diagnóstico (grupo controle): só diz que errou, com as duas respostas e a nota', async () => {
    // Arrange
    await renderFlow(createMockApi({ group: 'control' }));

    // Act
    await answer('Alternativa A: 2 sobre 5');

    // Assert
    expect(await screen.findByRole('header', { name: 'Resposta incorreta' })).toBeTruthy();
    expect(screen.getAllByLabelText('2 sobre 5').length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('5 sobre 6').length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/^Nota: /)).toBeTruthy();
    expect(screen.queryByText('Vamos entender o erro')).toBeNull();
    expect(screen.queryByText('Soma de numeradores e denominadores')).toBeNull();
  });
});

describe('desbloqueio', () => {
  async function renderUnlocking() {
    const mock = createMockApi();
    return renderFlow({
      ...mock,
      submitAttempt: async (exerciseId, request) => ({
        ...(await mock.submitAttempt(exerciseId, request)),
        unlockedTopics: [
          { id: 't3', name: 'Equações do 1º grau' },
          { id: 't4', name: 'Porcentagem' },
        ],
      }),
    });
  }

  it('uma resposta que libera tópicos abre a folha; "Continuar a lição" a fecha', async () => {
    // Arrange
    await renderUnlocking();

    // Act
    await answer('Alternativa B: 5 sobre 6');

    // Assert
    expect(
      await screen.findByRole('header', { name: 'Você liberou Equações do 1º grau e Porcentagem' }),
    ).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Continuar a lição' }));
    await waitFor(() => expect(screen.queryByText(/Você liberou/)).toBeNull());
    expect(screen.getByText('Resposta certa')).toBeTruthy();
  });

  it('"Ver na trilha" leva para a trilha', async () => {
    // Arrange
    const handlers = await renderUnlocking();
    await answer('Alternativa B: 5 sobre 6');

    // Act
    await fireEvent.press(await screen.findByRole('button', { name: 'Ver na trilha' }));

    // Assert
    expect(handlers.onSeeTrail).toHaveBeenCalledTimes(1);
  });
});

describe('fim de lição', () => {
  it('soma os acertos, mostra a nota e os flashcards novos, e volta para a trilha', async () => {
    // Arrange
    await openApp(PRACTICE);
    await answer('Alternativa B: 5 sobre 6');
    await proceed();
    await answer('Alternativa B: 3 sobre 6');
    await proceed();

    // Act
    await answer('Alternativa D: 11 sobre 12');
    await proceed();

    // Assert
    expect(await screen.findByText('Lição concluída')).toBeTruthy();
    expect(screen.getByLabelText('Acertos: 2 de 3')).toBeTruthy();
    expect(screen.getByLabelText(/^Nota do tópico: \d+$/)).toBeTruthy();
    expect(screen.getByLabelText('Flashcards novos: 1 cartão')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Revisar flashcards' })).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Voltar para a trilha' }));
    await expectPath('/trail');
  });

  it('sair no meio e voltar retoma do primeiro exercício não respondido', async () => {
    // Arrange
    await openApp(`/lessons/${LESSON}`);
    await fireEvent.press(await screen.findByRole('button', { name: 'Praticar · 3 exercícios' }));
    await answer('Alternativa B: 5 sobre 6');
    await proceed();
    await screen.findByLabelText('Exercício 2 de 3');

    // Act
    await fireEvent.press(screen.getByRole('button', { name: 'Sair dos exercícios' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Praticar · 3 exercícios' }));

    // Assert
    expect(await screen.findByLabelText('Exercício 2 de 3')).toBeTruthy();
  });
});

describe('whenLabel', () => {
  const now = new Date('2026-03-10T12:00:00Z');

  it.each([
    ['2026-03-10T15:00:00Z', 'hoje'],
    ['2026-03-11T12:00:00Z', 'amanhã'],
    ['2026-03-16T12:00:00Z', 'em 6 dias'],
  ])('%s é %s', (date, label) => expect(whenLabel(date, now)).toBe(label));
});
