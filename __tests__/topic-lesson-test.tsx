import { fireEvent, render, screen } from '@testing-library/react-native';

import type { TopicDetail } from '@/api';
import { TopicView } from '@/features/topic/TopicView';
import { isEquationLine } from '@/lib/math-markup';
import { expectPath, openApp, rememberSession, resetDevice } from 'test-utils/app';

const FRACTIONS = '0192f0c4-0001-7000-8000-000000000002';
const EQUATIONS = '0192f0c4-0001-7000-8000-000000000003';
const FRACTIONS_LESSON_2 = '0192f0c4-0003-7000-8000-000000000003';
const EQUATIONS_LESSON = '0192f0c4-0003-7000-8000-000000000004';

beforeEach(async () => {
  resetDevice();
  await rememberSession();
});

describe('tópico', () => {
  it('disponível: mostra a nota, a meta, o que falta e as lições', async () => {
    // Act
    await openApp(`/topics/${FRACTIONS}`);

    // Assert
    expect(await screen.findByRole('header', { name: 'Frações' })).toBeTruthy();
    expect(screen.getByText('Disponível')).toBeTruthy();
    expect(screen.getByRole('progressbar')).toBeTruthy();
    expect(
      screen.getByText(
        'Para dominar: nota 70 ou mais e pelo menos 5 exercícios respondidos. Você respondeu 3.',
      ),
    ).toBeTruthy();
    expect(screen.getByText('Ao dominar, libera Equações do 1º grau e Porcentagem.')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Lição 2: Soma com denominadores diferentes' }),
    ).toBeEnabled();
  });

  it('bloqueado: mostra os pré-requisitos que faltam, e as lições não abrem', async () => {
    // Act
    await openApp(`/topics/${EQUATIONS}`);

    // Assert
    expect(await screen.findByText('Para liberar, domine:')).toBeTruthy();
    expect(screen.getByText('Frações')).toBeTruthy();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Lição 1: Equações com uma operação, bloqueada' }),
    ).toBeDisabled();
  });

  it('sem o link da lição, ela não abre, mesmo num tópico disponível', async () => {
    // Arrange
    const onOpenLesson = jest.fn();
    const topic: TopicDetail = {
      id: 't1',
      slug: 'fracoes',
      name: 'Frações',
      status: 'available',
      score: 54,
      attemptCount: 6,
      masteryThreshold: 70,
      minAttempts: 5,
      prerequisites: [],
      unlocks: [],
      lessons: [{ id: 'l1', order: 1, title: 'Soma', links: [] }],
      links: [],
    };
    await render(<TopicView topic={topic} onBack={jest.fn()} onOpenLesson={onOpenLesson} />);

    // Act
    await fireEvent.press(screen.getByRole('button', { name: 'Lição 1: Soma, bloqueada' }));

    // Assert
    expect(onOpenLesson).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        'Para dominar: nota 70 ou mais. As respostas mais recentes e as mais difíceis pesam mais.',
      ),
    ).toBeTruthy();
  });

  it('um tópico que não existe oferece a volta para a trilha', async () => {
    // Arrange
    await openApp('/topics/nao-existe');

    // Act
    await fireEvent.press(await screen.findByRole('button', { name: 'Voltar para a trilha' }));

    // Assert
    expect(screen.queryByText('Tópico não encontrado')).toBeNull();
    await expectPath('/trail');
  });
});

describe('lição', () => {
  it('abre pelo tópico e desenha as frações do conteúdo', async () => {
    // Arrange
    await openApp(`/topics/${FRACTIONS}`);

    // Act
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Lição 2: Soma com denominadores diferentes' }),
    );

    // Assert
    await expectPath(`/lessons/${FRACTIONS_LESSON_2}`);
    expect(
      await screen.findByRole('header', { name: 'Soma com denominadores diferentes' }),
    ).toBeTruthy();
    expect(
      screen.getByLabelText('Agora sim, some os numeradores: 3 sobre 6 + 2 sobre 6 = 5 sobre 6.'),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Praticar · 3 exercícios' })).toBeTruthy();
  });

  it('"Praticar" leva aos exercícios da lição', async () => {
    // Arrange
    await openApp(`/lessons/${FRACTIONS_LESSON_2}`);

    // Act
    await fireEvent.press(await screen.findByRole('button', { name: 'Praticar · 3 exercícios' }));

    // Assert
    await expectPath(`/lessons/${FRACTIONS_LESSON_2}/practice`);
  });

  it('a lição de um tópico bloqueado diz que está bloqueada e não oferece praticar', async () => {
    // Act
    await openApp(`/lessons/${EQUATIONS_LESSON}`);

    // Assert
    expect(await screen.findByText('Lição bloqueada')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Praticar/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Voltar para a trilha' })).toBeTruthy();
  });
});

describe('isEquationLine', () => {
  it.each(['{1/5} + {2/5} = {3/5}', 'x + 3 = 7 → x = 7 − 3 → x = 4', '48 + 37 = 85'])(
    '"%s" é uma conta',
    (line) => expect(isEquationLine(line)).toBe(true),
  );

  it.each([
    'Agora sim, some os numeradores: {3/6} + {2/6} = {5/6}.',
    'Some só os numeradores.',
    '',
    '{1/2}',
  ])('"%s" não é uma conta', (line) => expect(isEquationLine(line)).toBe(false));
});
