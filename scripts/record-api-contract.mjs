#!/usr/bin/env node
// Grava, em __tests__/fixtures/api/, as respostas REAIS da API do back para os fluxos do app. O teste `api-contract-test` compara o
// formato do modo mock (campos, tipos e links) com elas; rode este script de novo quando o contrato do back mudar.
//
// Precisa de: a API no ar com o conteúdo carregado (veja o README do back) e o `psql` no PATH, porque o script põe o aluno no
// grupo certo e faz um cartão de revisão vencer direto no banco, coisas que a API não deixa o cliente fazer.
//
//   API_URL=http://localhost:5007 DATABASE_URL=postgresql://usuario:senha@localhost/banco node scripts/record-api-contract.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_URL = process.env.API_URL ?? 'http://localhost:5007';
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error(
    'Defina DATABASE_URL com a connection string do banco que a API usa (formato do psql).',
  );
  process.exit(1);
}

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '__tests__', 'fixtures', 'api');
mkdirSync(OUT, { recursive: true });

const sql = (query) =>
  execFileSync('psql', [DATABASE_URL, '-tAc', query], { encoding: 'utf8' }).trim();

async function call(method, path, { token, body } = {}) {
  const response = await fetch(API_URL + path, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

const written = [];
/** Só o corpo vai para o arquivo; o que é segredo ou muda a cada gravação (tokens, rastreio, e-mail) é trocado por um valor fixo. */
function save(name, response, expectedStatus) {
  if (response.status !== expectedStatus) {
    throw new Error(
      `${name}: esperava ${expectedStatus} e veio ${response.status}: ${JSON.stringify(response.body)}`,
    );
  }
  const text = JSON.stringify(response.body, null, 2)
    .replace(/"accessToken": "[^"]*"/g, '"accessToken": "token"')
    .replace(/"refreshToken": "[^"]*"/g, '"refreshToken": "token"')
    .replace(/"traceId": "[^"]*"/g, '"traceId": "trace"')
    .replace(/"email": "[^"]*"/g, '"email": "aluno@example.com"');
  writeFileSync(join(OUT, `${name}.json`), text + '\n');
  written.push(name);
}

const stamp = Date.now();
async function student(name, group) {
  const response = await call('POST', '/auth/register', {
    body: {
      name,
      email: `${name.toLowerCase()}.${stamp}@example.com`,
      password: 'Senha-valida-1!',
    },
  });
  sql(
    `UPDATE student SET experimental_group = '${group}' WHERE id = '${response.body.user.studentId}'`,
  );
  return { token: response.body.accessToken, studentId: response.body.user.studentId, response };
}

const ana = await student('Ana', 'diagnostic');
const bia = await student('Bia', 'control');
const caio = await student('Caio', 'diagnostic');
const get = (path, who = ana) => call('GET', path, { token: who.token });

save('session', ana.response, 201);
save('me', await get('/me'), 200);
const trail = await get('/trail');
save('trail', trail, 200);
const topics = Object.fromEntries(trail.body.topics.map((topic) => [topic.slug, topic]));
const basics = topics['operacoes-basicas'];
const fractions = topics['fracoes'];

const topic = await get(`/topics/${basics.id}`);
save('topic-available', topic, 200);
const lesson = await get(topic.body.lessons[0].links[0].href.replace(API_URL, ''));
save('lesson', lesson, 200);
save('topic-attempts-empty', await get(`/topics/${basics.id}/attempts`), 200);

const exerciseId = lesson.body.exercises[0].id;
const alternative = (correct) =>
  sql(
    `SELECT id FROM alternative WHERE exercise_id = '${exerciseId}' AND is_correct = ${correct} ORDER BY position LIMIT 1`,
  );
const answer = (correct, who = ana) =>
  call('POST', `/exercises/${exerciseId}/attempts`, {
    token: who.token,
    body: { alternativeId: alternative(correct), responseSeconds: 12 },
  });

save('attempt-wrong-diagnostic', await answer(false), 201);
save('attempt-wrong-control', await answer(false, bia), 201);
let last = await answer(true);
save('attempt-right', last, 201);
for (let round = 0; round < 12 && last.body.topic.status !== 'mastered'; round++) {
  last = await answer(true);
}
save('attempt-mastered', last, 201);

save('topic-after', await get(`/topics/${basics.id}`), 200);
save('topic-attempts', await get(`/topics/${basics.id}/attempts`), 200);
save('trail-after', await get('/trail'), 200);

sql(
  `UPDATE student_flashcard SET next_review_at = now() - interval '2 days' WHERE student_id = '${ana.studentId}'`,
);
const due = await get('/reviews/due');
save('reviews-due', due, 200);
save(
  'review',
  await call('POST', `/reviews/${due.body.items[0].id}`, {
    token: ana.token,
    body: { rating: 'good' },
  }),
  200,
);
save('reviews-due-empty', await get('/reviews/due'), 200);

save('topic-locked', await get(`/topics/${fractions.id}`, caio), 200);
const lockedLesson = (await get(`/topics/${fractions.id}`, caio)).body.lessons[0].id;
save('error-attempts-locked', await get(`/topics/${fractions.id}/attempts`, caio), 403);
save('error-lesson-locked', await get(`/lessons/${lockedLesson}`, caio), 403);
save('error-topic-not-found', await get('/topics/00000000-0000-7000-8000-000000000000', caio), 404);
save(
  'error-rating-invalid',
  await call('POST', `/reviews/${due.body.items[0].id}`, {
    token: ana.token,
    body: { rating: 'perfect' },
  }),
  400,
);
save(
  'error-card-not-found',
  await call('POST', '/reviews/00000000-0000-7000-8000-000000000000', {
    token: ana.token,
    body: { rating: 'good' },
  }),
  404,
);
save(
  'error-alternative-not-in-exercise',
  await call('POST', `/exercises/${exerciseId}/attempts`, {
    token: ana.token,
    body: { alternativeId: '00000000-0000-7000-8000-000000000000' },
  }),
  400,
);

console.log(`${written.length} respostas gravadas em ${OUT}`);
