import { TOPIC_ID } from '@/api/mock/content';
import {
  MOCK_ACCOUNT,
  computeScore,
  createMockApi,
  createMockBackend,
  lessonProgress,
} from '@/api/mock/mock-api';

const FRACTIONS_LESSON_2 = '0192f0c4-0003-7000-8000-000000000003';
const EX_HALF_PLUS_THIRD = '0192f0c4-0004-7000-8000-000000000003';
const ALT_CORRECT = '0192f0c4-0005-7000-8000-000000000010';
const ALT_SUM_ACROSS = '0192f0c4-0005-7000-8000-000000000009';
const ALT_MULTIPLY = '0192f0c4-0005-7000-8000-000000000012';
const EX_EQUATION = '0192f0c4-0004-7000-8000-000000000006';
const EQUATIONS_LESSON = '0192f0c4-0003-7000-8000-000000000004';

describe('computeScore', () => {
  it('segue a fórmula do back, com uma casa arredondada para baixo', () => {
    // Arrange: pesos 3, 0,9 e 1,62; nota = 100 × 4,62 / 5,52 = 83,69...
    const answers = [
      { difficulty: 'hard' as const, correct: true },
      { difficulty: 'easy' as const, correct: false },
      { difficulty: 'medium' as const, correct: true },
    ];

    // Act & Assert
    expect(computeScore(answers)).toBe(83.6);
    expect(computeScore([])).toBeNull();
  });
});

describe('createMockApi', () => {
  it('o /me traz o link self, como o back', async () => {
    // Arrange
    const { api, auth } = createMockBackend();
    await auth.login({ email: MOCK_ACCOUNT.email, password: MOCK_ACCOUNT.password });

    // Act
    const me = await api.getMe();

    // Assert
    expect(me.student.name).toBe(MOCK_ACCOUNT.name);
    expect(me.links.map((link) => [link.rel, link.method])).toEqual([
      ['self', 'GET'],
      ['trail', 'GET'],
    ]);
  });

  it('começa com Operações básicas dominado, Frações disponível e o resto bloqueado', async () => {
    // Arrange
    const api = createMockApi();

    // Act
    const trail = await api.getTrail();

    // Assert
    expect(trail.topics.map((topic) => topic.status)).toEqual([
      'mastered',
      'available',
      'locked',
      'locked',
    ]);
    expect(trail.dueReviews).toBe(2);
  });

  it('a lição vem sem o gabarito', async () => {
    // Arrange
    const api = createMockApi();

    // Act
    const lesson = await api.getLesson(FRACTIONS_LESSON_2);

    // Assert
    expect(lesson.exercises[0].alternatives[0]).toEqual({ id: ALT_SUM_ACROSS, text: '{2/5}' });
    expect(JSON.stringify(lesson)).not.toMatch(/correct|errorType/);
  });

  it('a lição de um tópico bloqueado dá 403 student.topic.locked', async () => {
    // Arrange
    const api = createMockApi();

    // Act & Assert
    await expect(api.getLesson(EQUATIONS_LESSON)).rejects.toMatchObject({
      status: 403,
      code: 'student.topic.locked',
    });
  });

  it('errar no grupo diagnóstico traz o tipo de erro e cria o cartão para amanhã', async () => {
    // Arrange
    const now = new Date('2026-11-16T13:00:00Z');
    const api = createMockApi({ now: () => now });

    // Act
    const result = await api.submitAttempt(EX_HALF_PLUS_THIRD, { alternativeId: ALT_MULTIPLY });

    // Assert
    expect(result.isCorrect).toBe(false);
    expect(result.feedback).toMatchObject({
      kind: 'incorrectWithDiagnosis',
      correctAnswer: '{5/6}',
      errorType: { name: 'Multiplicou em vez de somar' },
    });
    expect(result.flashcard?.nextReviewAt).toBe('2026-11-17T13:00:00.000Z');
  });

  it('errar um tipo de erro que o aluno já tem no cartão não cria outro', async () => {
    // Arrange
    const api = createMockApi();

    // Act
    const result = await api.submitAttempt(EX_HALF_PLUS_THIRD, { alternativeId: ALT_SUM_ACROSS });

    // Assert
    expect(result.flashcard).toBeNull();
  });

  it('errar no grupo controle traz só a resposta correta', async () => {
    // Arrange
    const api = createMockApi({ group: 'control' });

    // Act
    const result = await api.submitAttempt(EX_HALF_PLUS_THIRD, { alternativeId: ALT_SUM_ACROSS });

    // Assert
    expect(result.feedback).toEqual({ kind: 'incorrect', correctAnswer: '{5/6}', errorType: null });
  });

  it('dominar Frações libera Equações do 1º grau, e só na resposta que domina', async () => {
    // Arrange
    const api = createMockApi();

    // Act: acerta até dominar (o histórico inicial tem erros, então leva algumas respostas).
    const results = [];
    for (let i = 0; i < 8; i++) {
      results.push(await api.submitAttempt(EX_HALF_PLUS_THIRD, { alternativeId: ALT_CORRECT }));
    }

    // Assert
    const masteringIndex = results.findIndex((r) => r.topic.status === 'mastered');
    expect(masteringIndex).toBeGreaterThanOrEqual(0);
    expect(results[masteringIndex].topic.score).toBeGreaterThanOrEqual(70);
    expect(results[masteringIndex].unlockedTopics.map((t) => t.id)).toEqual([TOPIC_ID.equations]);
    expect(results.flatMap((r) => r.unlockedTopics)).toHaveLength(1);
    await expect(
      api.submitAttempt(EX_EQUATION, { alternativeId: '0192f0c4-0005-7000-8000-000000000021' }),
    ).resolves.toMatchObject({ isCorrect: true });
  });

  it('uma alternativa de outro exercício dá 400 answer.alternative.notInExercise', async () => {
    // Arrange
    const api = createMockApi();

    // Act & Assert
    await expect(
      api.submitAttempt(EX_HALF_PLUS_THIRD, {
        alternativeId: '0192f0c4-0005-7000-8000-000000000001',
      }),
    ).rejects.toMatchObject({ status: 400, code: 'answer.alternative.notInExercise' });
  });

  it('revisar tira o cartão das revisões do dia', async () => {
    // Arrange
    const api = createMockApi();
    const due = await api.getDueReviews();

    // Act
    await api.reviewCard(due.items[0].id, { rating: 'good' });

    // Assert
    expect((await api.getDueReviews()).count).toBe(due.count - 1);
  });
});

describe('lessonProgress', () => {
  const none = new Set<string>();

  it('sem tentativas, a lição não foi iniciada', () => {
    // Act
    const progress = lessonProgress(['a', 'b', 'c'], none, none);

    // Assert
    expect(progress).toEqual({ status: 'notStarted', completedExercises: 0, totalExercises: 3 });
  });

  it('com tentativas só erradas, a lição está em andamento: 0 de 3', () => {
    // Act
    const progress = lessonProgress(['a', 'b', 'c'], new Set(['a', 'b']), none);

    // Assert
    expect(progress).toEqual({ status: 'inProgress', completedExercises: 0, totalExercises: 3 });
  });

  it('com parte dos exercícios acertada, está em andamento: 2 de 3', () => {
    // Act
    const progress = lessonProgress(['a', 'b', 'c'], new Set(['a', 'b', 'c']), new Set(['a', 'b']));

    // Assert
    expect(progress).toEqual({ status: 'inProgress', completedExercises: 2, totalExercises: 3 });
  });

  it('com todos os exercícios acertados pelo menos uma vez, está concluída', () => {
    // Act
    const progress = lessonProgress(['a', 'b'], new Set(['a', 'b']), new Set(['a', 'b']));

    // Assert
    expect(progress).toEqual({ status: 'completed', completedExercises: 2, totalExercises: 2 });
  });

  it('ids de exercícios de outra lição são ignorados', () => {
    // Act
    const progress = lessonProgress(['a', 'b'], new Set(['x']), new Set(['x']));

    // Assert
    expect(progress).toEqual({ status: 'notStarted', completedExercises: 0, totalExercises: 2 });
  });

  it('uma lição sem exercícios não foi iniciada, 0 de 0, e nunca está concluída', () => {
    // Act
    const progress = lessonProgress([], new Set(['a']), new Set(['a']));

    // Assert
    expect(progress).toEqual({ status: 'notStarted', completedExercises: 0, totalExercises: 0 });
  });
});

describe('o estado da lição no mock', () => {
  const FRACTIONS_LESSON_1 = '0192f0c4-0003-7000-8000-000000000002';
  const FRACTIONS_LESSON_2 = '0192f0c4-0003-7000-8000-000000000003';
  const EX_FIRST = '0192f0c4-0004-7000-8000-000000000002';

  it('o aluno do mock nasce com Operações básicas concluída e Frações em andamento', async () => {
    // Arrange
    const api = createMockApi();

    // Act
    const fractions = await api.getTopic(TOPIC_ID.fractions);

    // Assert
    expect(fractions.lessons.map((lesson) => lesson.status)).toEqual(['completed', 'inProgress']);
  });

  it('a trilha conta as lições concluídas e as totais de cada tópico', async () => {
    // Arrange
    const api = createMockApi();

    // Act
    const trail = await api.getTrail();

    // Assert
    const counts = Object.fromEntries(
      trail.topics.map((topic) => [topic.id, [topic.completedLessons, topic.totalLessons]]),
    );
    expect(counts[TOPIC_ID.basics]).toEqual([1, 1]);
    expect(counts[TOPIC_ID.fractions]).toEqual([1, 2]);
    expect(counts[TOPIC_ID.equations]).toEqual([0, 1]);
  });

  it('a resposta traz a lição já com ela: acertar o último exercício que faltava a conclui', async () => {
    // Arrange: a lição 2 de Frações tem três exercícios, e o primeiro já foi tentado e errado
    const api = createMockApi();
    const lesson = await api.getLesson(FRACTIONS_LESSON_2);

    // Act
    const results = [];
    for (const exercise of lesson.exercises) {
      const probe = await api.submitAttempt(exercise.id, {
        alternativeId: exercise.alternatives[0].id,
      });
      results.push(
        probe.isCorrect
          ? probe
          : await api.submitAttempt(exercise.id, { alternativeId: probe.correctAlternativeId }),
      );
    }

    // Assert
    expect(results.map((result) => result.lesson.completedExercises)).toEqual([1, 2, 3]);
    expect(results.map((result) => result.lesson.status)).toEqual([
      'inProgress',
      'inProgress',
      'completed',
    ]);
    expect(results[0].lesson.id).toBe(FRACTIONS_LESSON_2);
  });

  it('errar depois um exercício já acertado não desfaz a conclusão da lição', async () => {
    // Arrange: a lição 1 de Frações já tem o único exercício acertado
    const api = createMockApi();
    const lesson = await api.getLesson(FRACTIONS_LESSON_1);
    const exercise = lesson.exercises.find((candidate) => candidate.id === EX_FIRST)!;
    const probe = await api.submitAttempt(exercise.id, {
      alternativeId: exercise.alternatives[0].id,
    });
    const wrong = exercise.alternatives.find(
      (alternative) => alternative.id !== probe.correctAlternativeId,
    )!;

    // Act
    const result = await api.submitAttempt(exercise.id, { alternativeId: wrong.id });

    // Assert
    expect(result.isCorrect).toBe(false);
    expect(result.lesson.status).toBe('completed');
  });

  it('o tópico liberado traz o link attempts, e o bloqueado não', async () => {
    // Arrange
    const api = createMockApi();

    // Act
    const open = await api.getTopic(TOPIC_ID.fractions);
    const locked = await api.getTopic(TOPIC_ID.percentage);

    // Assert
    expect(open.links.map((link) => link.rel)).toEqual(['self', 'trail', 'attempts']);
    expect(locked.links.map((link) => link.rel)).toEqual(['self', 'trail']);
  });

  it('o cartão da revisão do dia não traz fromError, como a API real', async () => {
    // Arrange
    const api = createMockApi();

    // Act
    const due = await api.getDueReviews();

    // Assert
    expect(due.items.length).toBeGreaterThan(0);
    expect(Object.keys(due.items[0]).sort()).toEqual(
      ['answer', 'id', 'links', 'nextReviewAt', 'question', 'topic'].sort(),
    );
  });
});
