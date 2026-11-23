/**
 * Os tipos de cada endpoint, escritos a partir do contrato da API (docs/api.md no back). Quando os endpoints existirem no
 * back, passam a ser gerados do OpenAPI; até lá, uma mudança no contrato muda este arquivo no mesmo PR.
 */

export type Link = { href: string; rel: string; method: 'GET' | 'POST' | 'PUT' | 'DELETE' };

export type Linked = { links: Link[] };

export type TopicStatus = 'locked' | 'available' | 'mastered';

export type Difficulty = 'easy' | 'medium' | 'hard';

/**
 * O estado de uma lição para o aluno, derivado das tentativas dele: `completed` é ter acertado cada exercício da lição pelo menos
 * uma vez (errar depois não desfaz), `inProgress` é ter tentado sem ter acertado todos, e `notStarted` é não ter tentado nenhum
 * (e também a lição sem exercícios). Concluir a lição não domina o tópico: quem libera a trilha é a nota.
 */
export type LessonStatus = 'notStarted' | 'inProgress' | 'completed';

export type FeedbackKind = 'correct' | 'incorrect' | 'incorrectWithDiagnosis';

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

// ---------- GET /me ----------

export type Me = Linked & {
  user: { id: string; email: string; role: string };
  student: { id: string; name: string; experimentalGroup: string };
};

// ---------- GET /trail ----------

export type TrailTopic = Linked & {
  id: string;
  slug: string;
  name: string;
  status: TopicStatus;
  /** De 0 a 100, com uma casa, arredondada para baixo; nula sem nenhuma resposta. */
  score: number | null;
  prerequisites: string[];
  /** Quantas lições do tópico o aluno concluiu, de quantas (`totalLessons`). */
  completedLessons: number;
  totalLessons: number;
};

export type Trail = Linked & {
  masteryThreshold: number;
  masteredTopics: number;
  totalTopics: number;
  dueReviews: number;
  topics: TrailTopic[];
};

// ---------- GET /topics/{id} ----------

export type TopicRef = { id: string; name: string };

export type TopicLesson = Linked & {
  id: string;
  order: number;
  title: string;
  status: LessonStatus;
  /** Os exercícios da lição que o aluno já acertou, de `totalExercises`. */
  completedExercises: number;
  totalExercises: number;
};

export type TopicDetail = Linked & {
  id: string;
  slug: string;
  name: string;
  status: TopicStatus;
  score: number | null;
  attemptCount: number;
  masteryThreshold: number;
  minAttempts: number;
  prerequisites: (TopicRef & { status: TopicStatus })[];
  unlocks: TopicRef[];
  lessons: TopicLesson[];
};

// ---------- GET /topics/{id}/attempts ----------
// O histórico que compõe a nota: o link `attempts` do tópico só existe quando ele está liberado.

export type TopicAttempt = {
  attemptId: string;
  exerciseId: string;
  statement: string;
  difficulty: Difficulty;
  isCorrect: boolean;
  answeredAt: string;
};

/** As respostas que entram na nota do tópico, da mais recente para a mais antiga. */
export type TopicAttempts = Linked & { items: TopicAttempt[] };

// ---------- GET /lessons/{id} ----------

/** Uma alternativa sem o gabarito: nada aqui diz se ela é a correta. */
export type LessonAlternative = { id: string; text: string };

export type LessonExercise = Linked & {
  id: string;
  statement: string;
  difficulty: Difficulty;
  alternatives: LessonAlternative[];
};

export type Lesson = Linked & {
  id: string;
  topicId: string;
  order: number;
  title: string;
  content: string;
  exercises: LessonExercise[];
};

// ---------- POST /exercises/{id}/attempts ----------

export type AttemptRequest = { alternativeId: string; responseSeconds?: number };

export type AttemptFeedback = {
  kind: FeedbackKind;
  correctAnswer: string;
  errorType: { name: string; feedback: string } | null;
};

export type AttemptResult = Linked & {
  attemptId: string;
  isCorrect: boolean;
  correctAlternativeId: string;
  feedback: AttemptFeedback;
  topic: { id: string; status: TopicStatus; score: number | null; attemptCount: number };
  /** A lição do exercício, já com esta resposta: é o que decide o "Lição concluída" do fim da prática. */
  lesson: { id: string; status: LessonStatus; completedExercises: number; totalExercises: number };
  unlockedTopics: TopicRef[];
  flashcard: { id: string; nextReviewAt: string } | null;
};

// ---------- GET /reviews/due e POST /reviews/{id} ----------

export type DueCard = Linked & {
  id: string;
  question: string;
  answer: string;
  topic: TopicRef;
  nextReviewAt: string;
};

export type DueReviews = Linked & { count: number; items: DueCard[] };

export type ReviewRequest = { rating: ReviewRating };

export type ReviewResult = Linked & { id: string; nextReviewAt: string };
