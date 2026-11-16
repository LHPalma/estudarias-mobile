import type { AuthApi, AuthSession } from '../auth';
import type { ApiClient } from '../client';
import { ApiError } from '../errors';
import type {
  AttemptResult,
  Difficulty,
  DueReviews,
  Lesson,
  Link,
  ReviewRating,
  TopicDetail,
  TopicStatus,
  Trail,
} from '../types';

import { ERROR_TYPES, MANUAL_CARDS, TOPICS, TOPIC_ID, mockId, type MockTopic } from './content';

/**
 * A API em memória, para o app rodar sem o back. Responde no formato do contrato e simula o ciclo com as mesmas regras do
 * servidor: a nota das últimas 10 respostas, ponderada por dificuldade e recência; o domínio com nota 70 e 5 respostas; o
 * desbloqueio dos dependentes; o flashcard criado pelo erro, uma vez por tipo de erro; e o retorno conforme o grupo.
 */

export type MockOptions = {
  /** O grupo experimental do aluno do mock: muda o retorno do erro. */
  group?: 'diagnostic' | 'control';
  /** Atraso artificial de cada resposta, para ver os estados de carregamento. */
  latencyMs?: number;
  now?: () => Date;
};

type Answer = { difficulty: Difficulty; correct: boolean };

type Card = {
  id: string;
  topicId: string;
  errorType: string | null;
  question: string;
  answer: string;
  nextReviewAt: Date;
  repetitions: number;
  intervalDays: number;
};

const BASE = 'http://mock.local';
const THRESHOLD = 70;
const MIN_ATTEMPTS = 5;
const WINDOW = 10;
const DECAY = 0.9;
const WEIGHT: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 };
const DAY = 24 * 60 * 60 * 1000;

const link = (path: string, rel: string, method: Link['method'] = 'GET'): Link => ({
  href: `${BASE}${path}`,
  rel,
  method,
});

/** A nota de 0 a 100, com uma casa, arredondada para baixo: a mesma fórmula do TopicScore do back. */
export function computeScore(mostRecentFirst: Answer[]): number | null {
  if (mostRecentFirst.length === 0) {
    return null;
  }

  let earned = 0;
  let total = 0;
  mostRecentFirst.slice(0, WINDOW).forEach((answer, position) => {
    const weight = WEIGHT[answer.difficulty] * DECAY ** position;
    total += weight;
    if (answer.correct) {
      earned += weight;
    }
  });

  return Math.floor(((100 * earned) / total) * 10) / 10;
}

type Account = { id: string; studentId: string; name: string; email: string; password: string };

const REFRESH_PREFIX = 'mock-refresh:';

/** A conta com que o mock já nasce, para entrar sem cadastrar. */
export const MOCK_ACCOUNT = { name: 'Ana', email: 'ana@example.com', password: 'Senha@123' };

export function createMockApi(options: MockOptions = {}): ApiClient {
  return createMockBackend(options).api;
}

/** A API e a autenticação em memória, juntas: o perfil (`/me`) é o de quem entrou. */
export function createMockBackend({
  group = 'diagnostic',
  latencyMs = 0,
  now = () => new Date(),
}: MockOptions = {}): { api: ApiClient; auth: AuthApi } {
  const accounts = new Map<string, Account>();
  let current: Account | null = null;

  function addAccount(name: string, email: string, password: string): Account {
    const account = { id: nextId(14), studentId: nextId(6), name, email, password };
    accounts.set(email.toLowerCase(), account);
    return account;
  }

  function sessionFor(account: Account): AuthSession {
    current = account;
    return {
      accessToken: `mock-access:${account.email}`,
      accessTokenExpiresAt: new Date(now().getTime() + 15 * 60 * 1000).toISOString(),
      refreshToken: `${REFRESH_PREFIX}${account.email}`,
      user: { id: account.id, email: account.email, role: 'Student', studentId: account.studentId },
    };
  }

  const history = new Map<string, Answer[]>(TOPICS.map((topic) => [topic.id, []]));
  const unlocked = new Set<string>([TOPIC_ID.basics, TOPIC_ID.fractions]);
  const mastered = new Set<string>([TOPIC_ID.basics]);
  const cards: Card[] = [];
  let sequence = 0;
  const nextId = (table: number) => mockId(table, 1000 + ++sequence);
  addAccount(MOCK_ACCOUNT.name, MOCK_ACCOUNT.email, MOCK_ACCOUNT.password);

  // O aluno do mock começa com Operações básicas dominado, Frações em andamento (3 respostas) e dois cartões vencidos.
  history.set(TOPIC_ID.basics, [
    ...Array<Answer>(4).fill({ difficulty: 'medium', correct: true }),
    { difficulty: 'easy', correct: false },
    ...Array<Answer>(5).fill({ difficulty: 'hard', correct: true }),
  ]);
  history.set(TOPIC_ID.fractions, [
    { difficulty: 'medium', correct: true },
    { difficulty: 'easy', correct: false },
    { difficulty: 'hard', correct: false },
  ]);
  const start = now();
  cards.push(
    newCard(TOPIC_ID.fractions, 'soma_direta', start),
    ...MANUAL_CARDS.map((manual) => ({
      id: nextId(13),
      topicId: manual.topicId,
      errorType: null,
      question: manual.question,
      answer: manual.answer,
      nextReviewAt: start,
      repetitions: 0,
      intervalDays: 1,
    })),
  );

  function newCard(topicId: string, errorType: string, nextReviewAt: Date): Card {
    const type = ERROR_TYPES[errorType];
    return {
      id: nextId(13),
      topicId,
      errorType,
      question: type.card.question,
      answer: type.card.answer,
      nextReviewAt,
      repetitions: 0,
      intervalDays: 1,
    };
  }

  const topicById = (topicId: string) => TOPICS.find((topic) => topic.id === topicId);
  const status = (topicId: string): TopicStatus =>
    mastered.has(topicId) ? 'mastered' : unlocked.has(topicId) ? 'available' : 'locked';
  const scoreOf = (topicId: string) => computeScore(history.get(topicId) ?? []);
  const dueCards = () =>
    cards
      .filter((card) => card.nextReviewAt.getTime() <= now().getTime())
      .sort((a, b) => a.nextReviewAt.getTime() - b.nextReviewAt.getTime());

  function findExercise(exerciseId: string) {
    for (const topic of TOPICS) {
      for (const lesson of topic.lessons) {
        const exercise = lesson.exercises.find((candidate) => candidate.id === exerciseId);
        if (exercise) {
          return { topic, lesson, exercise };
        }
      }
    }
    return undefined;
  }

  function evaluateMastery(topic: MockTopic) {
    const answers = history.get(topic.id) ?? [];
    const score = computeScore(answers);
    if (score !== null && score >= THRESHOLD && answers.length >= MIN_ATTEMPTS) {
      mastered.add(topic.id);
    }
    if (!mastered.has(topic.id)) {
      return [];
    }

    return TOPICS.filter(
      (dependent) =>
        dependent.prerequisites.includes(topic.id) &&
        !unlocked.has(dependent.id) &&
        dependent.prerequisites.every((requisite) => mastered.has(requisite)),
    ).map((dependent) => {
      unlocked.add(dependent.id);
      return { id: dependent.id, name: dependent.name };
    });
  }

  const respond = async <T>(produce: () => T): Promise<T> => {
    if (latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, latencyMs));
    }
    return produce();
  };

  const auth: AuthApi = {
    register: ({ name, email, password }) =>
      respond(() => {
        if (name.trim().length === 0) {
          throw new ApiError(400, 'student.name.required', 'Validation error');
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
          throw new ApiError(400, 'identity.email.invalid', 'Validation error');
        }
        if (password.length < 8) {
          throw new ApiError(400, 'identity.password.tooShort', 'Validation error');
        }
        if (accounts.has(email.toLowerCase())) {
          throw new ApiError(409, 'identity.email.taken', 'Conflict');
        }
        return sessionFor(addAccount(name.trim(), email, password));
      }),

    login: ({ email, password }) =>
      respond(() => {
        const account = accounts.get(email.toLowerCase());
        if (!account || account.password !== password) {
          throw new ApiError(401, 'identity.credentials.invalid', 'Unauthorized');
        }
        return sessionFor(account);
      }),

    // O mock vive em memória: uma conta cadastrada some ao recarregar o app, e o token dela passa a ser recusado.
    refresh: (refreshToken) =>
      respond(() => {
        const account = refreshToken.startsWith(REFRESH_PREFIX)
          ? accounts.get(refreshToken.slice(REFRESH_PREFIX.length).toLowerCase())
          : undefined;
        if (!account) {
          throw new ApiError(401, 'identity.refreshToken.invalid', 'Unauthorized');
        }
        return sessionFor(account);
      }),

    logout: () =>
      respond(() => {
        current = null;
      }),
  };

  const api: ApiClient = {
    getMe: () =>
      respond(() => {
        if (!current) {
          throw new ApiError(401, 'identity.session.invalid', 'Unauthorized');
        }
        return {
          user: { id: current.id, email: current.email, role: 'Student' },
          student: {
            id: current.studentId,
            name: current.name,
            experimentalGroup: group === 'control' ? 'Control' : 'Diagnostic',
          },
        };
      }),

    getTrail: () =>
      respond<Trail>(() => ({
        masteryThreshold: THRESHOLD,
        masteredTopics: TOPICS.filter((topic) => mastered.has(topic.id)).length,
        totalTopics: TOPICS.length,
        dueReviews: dueCards().length,
        topics: TOPICS.map((topic) => ({
          id: topic.id,
          slug: topic.slug,
          name: topic.name,
          status: status(topic.id),
          score: scoreOf(topic.id),
          prerequisites: topic.prerequisites,
          links: [link(`/topics/${topic.id}`, 'topic')],
        })),
        links: [link('/trail', 'self'), link('/reviews/due', 'reviews')],
      })),

    getTopic: (topicId) =>
      respond<TopicDetail>(() => {
        const topic = topicById(topicId);
        if (!topic) {
          throw new ApiError(404, 'trail.topic.notFound', 'Not found');
        }
        const open = status(topic.id) !== 'locked';
        return {
          id: topic.id,
          slug: topic.slug,
          name: topic.name,
          status: status(topic.id),
          score: scoreOf(topic.id),
          attemptCount: history.get(topic.id)?.length ?? 0,
          masteryThreshold: THRESHOLD,
          minAttempts: MIN_ATTEMPTS,
          prerequisites: topic.prerequisites.map((requisiteId) => ({
            id: requisiteId,
            name: topicById(requisiteId)?.name ?? '',
            status: status(requisiteId),
          })),
          unlocks: TOPICS.filter((other) => other.prerequisites.includes(topic.id)).map(
            (other) => ({ id: other.id, name: other.name }),
          ),
          lessons: topic.lessons.map((lesson) => ({
            id: lesson.id,
            order: lesson.order,
            title: lesson.title,
            links: open ? [link(`/lessons/${lesson.id}`, 'lesson')] : [],
          })),
          links: [link(`/topics/${topic.id}`, 'self'), link('/trail', 'trail')],
        };
      }),

    getLesson: (lessonId) =>
      respond<Lesson>(() => {
        const topic = TOPICS.find((candidate) =>
          candidate.lessons.some((lesson) => lesson.id === lessonId),
        );
        const lesson = topic?.lessons.find((candidate) => candidate.id === lessonId);
        if (!topic || !lesson) {
          throw new ApiError(404, 'trail.lesson.notFound', 'Not found');
        }
        if (status(topic.id) === 'locked') {
          throw new ApiError(403, 'student.topic.locked', 'Forbidden');
        }
        return {
          id: lesson.id,
          topicId: topic.id,
          order: lesson.order,
          title: lesson.title,
          content: lesson.content,
          exercises: lesson.exercises.map((exercise) => ({
            id: exercise.id,
            statement: exercise.statement,
            difficulty: exercise.difficulty,
            alternatives: exercise.alternatives.map(({ id, text }) => ({ id, text })),
            links: [link(`/exercises/${exercise.id}/attempts`, 'answer', 'POST')],
          })),
          links: [link(`/lessons/${lesson.id}`, 'self'), link(`/topics/${topic.id}`, 'topic')],
        };
      }),

    submitAttempt: (exerciseId, request) =>
      respond<AttemptResult>(() => {
        const found = findExercise(exerciseId);
        if (!found) {
          throw new ApiError(404, 'trail.exercise.notFound', 'Not found');
        }
        const { topic, exercise } = found;
        if (status(topic.id) === 'locked') {
          throw new ApiError(403, 'student.topic.locked', 'Forbidden');
        }
        const chosen = exercise.alternatives.find(
          (alternative) => alternative.id === request.alternativeId,
        );
        if (!chosen) {
          throw new ApiError(400, 'answer.alternative.notInExercise', 'Validation error');
        }
        if (request.responseSeconds !== undefined && request.responseSeconds < 0) {
          throw new ApiError(400, 'attempt.responseTime.invalid', 'Validation error');
        }

        const isCorrect = chosen.id === exercise.correct;
        history.set(topic.id, [
          { difficulty: exercise.difficulty, correct: isCorrect },
          ...(history.get(topic.id) ?? []),
        ]);
        const unlockedTopics = evaluateMastery(topic);

        let flashcard: AttemptResult['flashcard'] = null;
        const errorType = isCorrect ? null : (chosen.errorType ?? null);
        if (errorType && !cards.some((card) => card.errorType === errorType)) {
          const card = newCard(topic.id, errorType, new Date(now().getTime() + DAY));
          cards.push(card);
          flashcard = { id: card.id, nextReviewAt: card.nextReviewAt.toISOString() };
        }

        const correctText =
          exercise.alternatives.find((a) => a.id === exercise.correct)?.text ?? '';
        const type = errorType ? ERROR_TYPES[errorType] : null;

        return {
          attemptId: nextId(8),
          isCorrect,
          correctAlternativeId: exercise.correct,
          feedback: isCorrect
            ? { kind: 'correct', correctAnswer: correctText, errorType: null }
            : group === 'diagnostic' && type
              ? {
                  kind: 'incorrectWithDiagnosis',
                  correctAnswer: correctText,
                  errorType: { name: type.name, feedback: type.feedback },
                }
              : { kind: 'incorrect', correctAnswer: correctText, errorType: null },
          topic: {
            id: topic.id,
            status: status(topic.id),
            score: scoreOf(topic.id),
            attemptCount: history.get(topic.id)?.length ?? 0,
          },
          unlockedTopics,
          flashcard,
          links: [link(`/topics/${topic.id}`, 'topic'), link('/reviews/due', 'reviews')],
        };
      }),

    getDueReviews: () =>
      respond<DueReviews>(() => {
        const due = dueCards();
        return {
          count: due.length,
          items: due.map((card) => ({
            id: card.id,
            question: card.question,
            answer: card.answer,
            topic: { id: card.topicId, name: topicById(card.topicId)?.name ?? '' },
            nextReviewAt: card.nextReviewAt.toISOString(),
            fromError: card.errorType !== null,
            links: [link(`/reviews/${card.id}`, 'review', 'POST')],
          })),
          links: [link('/reviews/due', 'self'), link('/trail', 'trail')],
        };
      }),

    reviewCard: (cardId, request) =>
      respond(() => {
        const card = cards.find((candidate) => candidate.id === cardId);
        if (!card) {
          throw new ApiError(404, 'review.card.notFound', 'Not found');
        }
        const ratings: ReviewRating[] = ['again', 'hard', 'good', 'easy'];
        if (!ratings.includes(request.rating)) {
          throw new ApiError(400, 'studentFlashcard.rating.invalid', 'Validation error');
        }

        // Uma aproximação do SM-2, só para o mock: errar volta a 1 dia; acertar vai a 1, 6 e depois 2,5 vezes o intervalo.
        if (request.rating === 'again') {
          card.repetitions = 0;
          card.intervalDays = 1;
        } else {
          card.intervalDays =
            card.repetitions === 0
              ? 1
              : card.repetitions === 1
                ? 6
                : Math.round(card.intervalDays * 2.5);
          card.repetitions += 1;
        }
        card.nextReviewAt = new Date(now().getTime() + card.intervalDays * DAY);

        return {
          id: card.id,
          nextReviewAt: card.nextReviewAt.toISOString(),
          links: [link('/reviews/due', 'reviews')],
        };
      }),
  };

  return { api, auth };
}
