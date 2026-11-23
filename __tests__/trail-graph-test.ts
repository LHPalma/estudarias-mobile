import { joinNames, lessonProgressLabel, lessonsSummary, plural, shownScore } from '@/lib/format';
import { layoutTrail } from '@/lib/trail-graph';

describe('layoutTrail', () => {
  const trail = [
    { id: 'basicas', prerequisites: [] },
    { id: 'fracoes', prerequisites: ['basicas'] },
    { id: 'equacoes', prerequisites: ['fracoes'] },
    { id: 'porcentagem', prerequisites: ['fracoes', 'equacoes'] },
  ];

  it('põe cada tópico um nível abaixo do pré-requisito mais fundo', () => {
    // Act
    const graph = layoutTrail(trail);

    // Assert
    expect(graph.nodes.map((node) => [node.id, node.level])).toEqual([
      ['basicas', 0],
      ['fracoes', 1],
      ['equacoes', 2],
      ['porcentagem', 3],
    ]);
    expect(graph.levels).toBe(4);
  });

  it('um tópico sozinho no nível alterna de lado, para a seta que pula um nível não cruzá-lo', () => {
    // Act
    const graph = layoutTrail(trail);

    // Assert
    expect(graph.nodes.map((node) => node.x)).toEqual([0.5, 0.32, 0.68, 0.32]);
  });

  it('liga cada tópico aos seus pré-requisitos', () => {
    // Act
    const graph = layoutTrail(trail);

    // Assert
    expect(graph.edges).toEqual([
      { from: 'basicas', to: 'fracoes' },
      { from: 'fracoes', to: 'equacoes' },
      { from: 'fracoes', to: 'porcentagem' },
      { from: 'equacoes', to: 'porcentagem' },
    ]);
  });

  it('espalha na largura os tópicos de um mesmo nível', () => {
    // Act
    const graph = layoutTrail([
      { id: 'raiz', prerequisites: [] },
      { id: 'a', prerequisites: ['raiz'] },
      { id: 'b', prerequisites: ['raiz'] },
    ]);

    // Assert
    expect(graph.nodes.map((node) => node.x)).toEqual([0.5, 1 / 3, 2 / 3]);
  });

  it('um pré-requisito desconhecido ou um ciclo não trava o desenho', () => {
    // Act
    const graph = layoutTrail([
      { id: 'a', prerequisites: ['b', 'sumiu'] },
      { id: 'b', prerequisites: ['a'] },
    ]);

    // Assert
    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toEqual([
      { from: 'b', to: 'a' },
      { from: 'a', to: 'b' },
    ]);
  });
});

describe('formatação', () => {
  it('a nota mostra só a parte inteira, e um traço sem nota', () => {
    expect(shownScore(69.9)).toBe('69');
    expect(shownScore(null)).toBe('–');
  });

  it('junta nomes em português', () => {
    expect(joinNames(['Frações'])).toBe('Frações');
    expect(joinNames(['Frações', 'Equações'])).toBe('Frações e Equações');
    expect(joinNames(['A', 'B', 'C'])).toBe('A, B e C');
  });

  it('escolhe singular ou plural pela quantidade', () => {
    expect(plural(1, 'flashcard', 'flashcards')).toBe('1 flashcard');
    expect(plural(2, 'flashcard', 'flashcards')).toBe('2 flashcards');
  });

  it('escreve as lições concluídas, no singular e no plural', () => {
    expect(lessonsSummary(0, 1)).toBe('0 de 1 lição concluída');
    expect(lessonsSummary(1, 2)).toBe('1 de 2 lições concluídas');
  });

  it('diz o que o aluno já fez em cada lição', () => {
    expect(lessonProgressLabel('completed', 3, 3)).toBe('Concluída');
    expect(lessonProgressLabel('inProgress', 1, 3)).toBe('1 de 3 exercícios acertados');
    expect(lessonProgressLabel('inProgress', 0, 1)).toBe('0 de 1 exercício acertado');
    expect(lessonProgressLabel('notStarted', 0, 2)).toBe('2 exercícios');
    expect(lessonProgressLabel('notStarted', 0, 0)).toBe('Sem exercícios');
  });
});
