import { ApiError } from '@/api/errors';
import { TOPIC_ID } from '@/api/mock/content';
import { MOCK_ACCOUNT, createMockBackend } from '@/api/mock/mock-api';
import type { ApiClient } from '@/api/client';
import type { ReviewRating } from '@/api';

/**
 * O contrato do mock com a API de verdade. As respostas em `__tests__/fixtures/api/` foram gravadas da API do back por
 * `scripts/record-api-contract.mjs`; aqui o modo mock responde aos mesmos fluxos e o FORMATO das respostas (campos, tipos e
 * links) tem de ser o mesmo. Os valores (ids, textos, notas) não se comparam: o conteúdo do mock é outro. Quando o back mudar o
 * contrato, grave as respostas de novo, e este teste mostra o que o mock precisa acompanhar.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fixture = (name: string): unknown => require(`./fixtures/api/${name}.json`);

function kind(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/**
 * As diferenças de formato entre a resposta real e a do mock. Um campo nulo de um lado e preenchido do outro é aceito (a nota de
 * quem não respondeu nada, o cartão que o erro não criou): o que muda é o cenário, e não o contrato. Listas vazias não dizem o
 * formato dos itens, então só se comparam os primeiros itens quando os dois lados têm.
 */
function shapeDifferences(real: unknown, mock: unknown, path: string): string[] {
  const realKind = kind(real);
  const mockKind = kind(mock);
  if (realKind === 'null' || mockKind === 'null') return [];
  if (realKind !== mockKind) return [`${path}: a API manda ${realKind}, o mock manda ${mockKind}`];

  if (realKind === 'object') {
    const a = real as Record<string, unknown>;
    const b = mock as Record<string, unknown>;
    return [...new Set([...Object.keys(a), ...Object.keys(b)])].sort().flatMap((key) => {
      if (!(key in b)) return [`${path}.${key}: a API manda, o mock não`];
      if (!(key in a)) return [`${path}.${key}: o mock manda, a API não`];
      return shapeDifferences(a[key], b[key], `${path}.${key}`);
    });
  }

  if (realKind === 'array') {
    const a = real as unknown[];
    const b = mock as unknown[];
    return a.length > 0 && b.length > 0 ? shapeDifferences(a[0], b[0], `${path}[]`) : [];
  }

  return [];
}

/** Os links de cada recurso (rel e método), pelo caminho do recurso na resposta: é o que o app usa para decidir os botões. */
function linkSets(
  value: unknown,
  path = '$',
  out: Record<string, string[]> = {},
): Record<string, string[]> {
  if (Array.isArray(value)) {
    if (value.length > 0) linkSets(value[0], `${path}[]`, out);
  } else if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.links)) {
      out[path] = (record.links as { rel: string; method: string }[])
        .map((link) => `${link.method} ${link.rel}`)
        .sort();
    }
    for (const [key, child] of Object.entries(record)) {
      if (key !== 'links') linkSets(child, `${path}.${key}`, out);
    }
  }
  return out;
}

function expectSameContract(name: string, mock: unknown) {
  const real = fixture(name);
  expect(shapeDifferences(real, mock, name)).toEqual([]);
  expect(linkSets(mock)).toEqual(linkSets(real));
}

async function loggedIn(group: 'diagnostic' | 'control' = 'diagnostic') {
  const backend = createMockBackend({ group });
  const session = await backend.auth.login({
    email: MOCK_ACCOUNT.email,
    password: MOCK_ACCOUNT.password,
  });
  return { api: backend.api, session };
}

async function codeOf(call: () => Promise<unknown>): Promise<[number | undefined, string | null]> {
  try {
    await call();
  } catch (error) {
    if (error instanceof ApiError) return [error.status, error.code];
    throw error;
  }
  throw new Error('a chamada deveria falhar');
}

/** Acerta e erra um exercício do mock sem conhecer o gabarito: a primeira resposta revela a correta. */
async function answers(api: ApiClient, exerciseId: string, alternativeIds: string[]) {
  const probe = await api.submitAttempt(exerciseId, { alternativeId: alternativeIds[0] });
  const correct = probe.correctAlternativeId;
  const wrong = alternativeIds.find((id) => id !== correct) ?? alternativeIds[0];
  return { correct, wrong };
}

const FRACTIONS_LESSON_2 = '0192f0c4-0003-7000-8000-000000000003';

describe('o mock segue o contrato da API real', () => {
  it('a sessão, o perfil e a trilha', async () => {
    // Arrange
    const { api, session } = await loggedIn();

    // Act
    const me = await api.getMe();
    const trail = await api.getTrail();

    // Assert
    expectSameContract('session', session);
    expectSameContract('me', me);
    expectSameContract('trail', trail);
  });

  it('o tópico liberado, o bloqueado e a lição', async () => {
    // Arrange
    const { api } = await loggedIn();

    // Act
    const topic = await api.getTopic(TOPIC_ID.fractions);
    const locked = await api.getTopic(TOPIC_ID.percentage);
    const lesson = await api.getLesson(topic.lessons[0].id);

    // Assert
    expectSameContract('topic-available', topic);
    expectSameContract('topic-locked', locked);
    expectSameContract('lesson', lesson);
  });

  it('o histórico de respostas do tópico', async () => {
    // Arrange
    const { api } = await loggedIn();

    // Act
    const attempts = await api.getTopicAttempts(TOPIC_ID.fractions);

    // Assert
    expectSameContract('topic-attempts', attempts);
  });

  it('responder: o acerto, o erro nos dois grupos e o que domina o tópico', async () => {
    // Arrange
    const diagnostic = await loggedIn('diagnostic');
    const control = await loggedIn('control');
    const lesson = await diagnostic.api.getLesson(FRACTIONS_LESSON_2);
    const exercise = lesson.exercises[0];
    const ids = exercise.alternatives.map((alternative) => alternative.id);
    const { correct, wrong } = await answers(diagnostic.api, exercise.id, ids);

    // Act
    const wrongDiagnostic = await diagnostic.api.submitAttempt(exercise.id, {
      alternativeId: wrong,
      responseSeconds: 12,
    });
    const wrongControl = await control.api.submitAttempt(exercise.id, {
      alternativeId: wrong,
      responseSeconds: 12,
    });
    let last = await diagnostic.api.submitAttempt(exercise.id, { alternativeId: correct });
    const right = last;
    for (let round = 0; round < 12 && last.topic.status !== 'mastered'; round++) {
      last = await diagnostic.api.submitAttempt(exercise.id, { alternativeId: correct });
    }

    // Assert
    expectSameContract('attempt-wrong-diagnostic', wrongDiagnostic);
    expectSameContract('attempt-wrong-control', wrongControl);
    expectSameContract('attempt-right', right);
    expectSameContract('attempt-mastered', last);
  });

  it('depois de responder: o tópico, o histórico e a trilha', async () => {
    // Arrange
    const { api } = await loggedIn();
    const lesson = await api.getLesson(FRACTIONS_LESSON_2);
    const exercise = lesson.exercises[0];
    const { correct } = await answers(
      api,
      exercise.id,
      exercise.alternatives.map((a) => a.id),
    );
    await api.submitAttempt(exercise.id, { alternativeId: correct });

    // Act
    const topic = await api.getTopic(TOPIC_ID.fractions);
    const trail = await api.getTrail();

    // Assert
    expectSameContract('topic-after', topic);
    expectSameContract('trail-after', trail);
  });

  it('as revisões do dia, a revisão feita e a lista vazia', async () => {
    // Arrange
    const { api } = await loggedIn();
    const due = await api.getDueReviews();

    // Act
    const reviewed = await api.reviewCard(due.items[0].id, { rating: 'good' });
    for (const item of (await api.getDueReviews()).items) {
      await api.reviewCard(item.id, { rating: 'good' });
    }
    const empty = await api.getDueReviews();

    // Assert
    expectSameContract('reviews-due', due);
    expectSameContract('review', reviewed);
    expectSameContract('reviews-due-empty', empty);
  });

  it('os erros: o mesmo status e o mesmo code que a API manda', async () => {
    // Arrange
    const { api } = await loggedIn();
    const lesson = await api.getLesson(FRACTIONS_LESSON_2);
    const exercise = lesson.exercises[0];
    const equationsLesson = '0192f0c4-0003-7000-8000-000000000004';
    const expected = (name: string): [number, string] => {
      const body = fixture(name) as { status: number; code: string };
      return [body.status, body.code];
    };

    // Act & Assert
    expect(await codeOf(() => api.getTopicAttempts(TOPIC_ID.percentage))).toEqual(
      expected('error-attempts-locked'),
    );
    expect(await codeOf(() => api.getLesson(equationsLesson))).toEqual(
      expected('error-lesson-locked'),
    );
    expect(await codeOf(() => api.getTopic('nao-existe'))).toEqual(
      expected('error-topic-not-found'),
    );
    expect(await codeOf(() => api.reviewCard('nao-existe', { rating: 'good' }))).toEqual(
      expected('error-card-not-found'),
    );
    expect(
      await codeOf(async () => {
        const [card] = (await api.getDueReviews()).items;
        return api.reviewCard(card.id, { rating: 'perfect' as ReviewRating });
      }),
    ).toEqual(expected('error-rating-invalid'));
    expect(
      await codeOf(() => api.submitAttempt(exercise.id, { alternativeId: 'de-outro-exercicio' })),
    ).toEqual(expected('error-alternative-not-in-exercise'));
  });

  it('o app lê o code de cada erro real, pelo ProblemDetails', () => {
    // Act & Assert
    for (const name of ['error-attempts-locked', 'error-topic-not-found', 'error-rating-invalid']) {
      const body = fixture(name) as { status: number; code: string };
      const error = ApiError.fromProblem(body.status, body);
      expect([error.status, error.code]).toEqual([body.status, body.code]);
    }
  });
});
