import { fireEvent, render, screen } from '@testing-library/react-native';

import type { Trail } from '@/api';
import { TrailView } from '@/features/trail/TrailView';
import { expectPath, openApp, rememberSession, resetDevice } from 'test-utils/app';

beforeEach(async () => {
  resetDevice();
  await rememberSession();
});

describe('trilha', () => {
  it('mostra o progresso, o aviso de revisões e os tópicos nos três status', async () => {
    // Act
    await openApp('/trail');

    // Assert
    expect(await screen.findByText('1 de 4 tópicos dominados')).toBeTruthy();
    expect(screen.getByRole('button', { name: '2 flashcards para revisar hoje' })).toBeTruthy();
    expect(
      screen.getByRole('button', { name: /^Operações básicas, dominado, nota \d+$/ }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: /^Frações, em andamento, nota \d+, meta 70$/ }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Equações do 1º grau, bloqueado. Requer Frações' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', {
        name: 'Porcentagem, bloqueado. Requer Frações e Equações do 1º grau',
      }),
    ).toBeTruthy();
  });

  it('o tópico em andamento mostra quantas lições já foram concluídas', async () => {
    // Act
    await openApp('/trail');

    // Assert
    expect(await screen.findByText('1 de 2 lições concluídas')).toBeTruthy();
  });

  it('tocar num tópico abre o tópico', async () => {
    // Arrange
    await openApp('/trail');

    // Act
    await fireEvent.press(await screen.findByRole('button', { name: /^Frações, em andamento/ }));

    // Assert
    await expectPath('/topics/0192f0c4-0001-7000-8000-000000000002');
    expect(await screen.findByRole('header', { name: 'Frações' })).toBeTruthy();
  });

  it('o aviso de revisões leva para a aba Revisão', async () => {
    // Arrange
    await openApp('/trail');

    // Act
    await fireEvent.press(
      await screen.findByRole('button', { name: '2 flashcards para revisar hoje' }),
    );

    // Assert
    await expectPath('/review');
  });

  it('sem revisões vencidas, o aviso não aparece', async () => {
    // Arrange
    const trail: Trail = {
      masteryThreshold: 70,
      masteredTopics: 0,
      totalTopics: 1,
      dueReviews: 0,
      topics: [
        {
          id: 't1',
          slug: 'basicas',
          name: 'Operações básicas',
          status: 'available',
          score: null,
          prerequisites: [],
          completedLessons: 0,
          totalLessons: 0,
          links: [],
        },
      ],
      links: [],
    };

    // Act
    await render(
      <TrailView
        trail={trail}
        studentName="Ana"
        onOpenTopic={jest.fn()}
        onOpenMap={jest.fn()}
        onOpenReviews={jest.fn()}
      />,
    );

    // Assert
    expect(screen.getByText('0 de 1 tópico dominado')).toBeTruthy();
    expect(screen.queryByText(/para revisar hoje/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Operações básicas, disponível' })).toBeTruthy();
  });
});

describe('mapa', () => {
  it('abre pela trilha, com um nó por tópico e o painel do tópico em andamento', async () => {
    // Arrange
    await openApp('/trail');

    // Act
    await fireEvent.press(await screen.findByRole('button', { name: 'Ver o mapa da trilha' }));

    // Assert
    await expectPath('/map');
    expect(await screen.findByRole('button', { name: 'Operações básicas, dominado' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Porcentagem, bloqueado' })).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Frações' })).toBeTruthy();
    expect(screen.getByText('Equações do 1º grau e Porcentagem')).toBeTruthy();
  });

  it('tocar num nó mostra o que ele exige e o que libera, e abre o tópico', async () => {
    // Arrange
    await openApp('/map');

    // Act
    await fireEvent.press(await screen.findByRole('button', { name: 'Porcentagem, bloqueado' }));

    // Assert
    expect(screen.getByRole('header', { name: 'Porcentagem' })).toBeTruthy();
    expect(screen.getByText('Frações e Equações do 1º grau')).toBeTruthy();
    expect(screen.getByText('Fim da trilha')).toBeTruthy();

    // Act
    await fireEvent.press(screen.getByRole('button', { name: 'Abrir tópico' }));

    // Assert
    await expectPath('/topics/0192f0c4-0001-7000-8000-000000000004');
  });
});
