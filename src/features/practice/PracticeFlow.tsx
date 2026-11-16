import { useQueryClient } from '@tanstack/react-query';

import {
  queryKeys,
  useDueReviews,
  useSubmitAttempt,
  type Lesson,
  type TopicDetail,
  type Trail,
} from '@/api';

import { DiagnosisStep } from './DiagnosisStep';
import { ExerciseStep, type Outcome } from './ExerciseStep';
import { LessonSummary } from './LessonSummary';
import { MasterySheet } from './MasterySheet';
import { usePracticeProgress, type Answered } from './progress';

type Props = {
  lesson: Lesson;
  onExit: () => void;
  onSeeTrail: () => void;
  onReview: () => void;
};

/**
 * A prática de uma lição, do primeiro exercício ao resumo. Cada resposta vai para a API na hora; o retorno decide o que
 * vem depois: a faixa de acerto, a tela do erro, a folha de domínio (se a resposta dominou o tópico ou liberou outros) e, no fim, o resumo.
 */
export function PracticeFlow({ lesson, onExit, onSeeTrail, onReview }: Props) {
  const queryClient = useQueryClient();
  const { progress, update, reset } = usePracticeProgress(lesson.id);
  const dueReviews = useDueReviews();

  const { exercises } = lesson;
  const finished = progress.seen >= exercises.length;
  const exercise = exercises[Math.min(progress.seen, exercises.length - 1)];
  // A resposta ao exercício atual, enquanto o retorno dela está na tela.
  const answered = finished ? undefined : progress.answers[progress.seen];
  const submit = useSubmitAttempt(exercise.id);

  const cachedTopic = () => {
    const topic = queryClient.getQueryData<TopicDetail>(queryKeys.topic(lesson.topicId));
    const trail = queryClient.getQueryData<Trail>(queryKeys.trail);
    return topic ?? trail?.topics.find((item) => item.id === lesson.topicId);
  };

  /** O tópico antes de responder: como ficou na última resposta desta sessão, ou como o app o tinha em cache. */
  const topicBefore = () => {
    const last = progress.answers[progress.answers.length - 1];
    const known = last ? last.result.topic : cachedTopic();
    return { score: known?.score ?? null, status: known?.status ?? null };
  };

  if (finished) {
    return (
      <LessonSummary
        lessonTitle={lesson.title}
        answers={progress.answers}
        dueReviews={dueReviews.data?.count ?? 0}
        onReview={() => {
          reset();
          onReview();
        }}
        onBackToTrail={() => {
          reset();
          onSeeTrail();
        }}
      />
    );
  }

  const outcomes: Outcome[] = exercises.map((_, index) => {
    const answer = progress.answers[index];
    return answer ? (answer.result.isCorrect ? 'correct' : 'wrong') : null;
  });
  const next = () => update((p) => ({ ...p, seen: p.seen + 1, unlockSeen: false }));

  return (
    <>
      {answered && !answered.result.isCorrect ? (
        <DiagnosisStep exercise={exercise} answered={answered} onContinue={next} />
      ) : (
        <ExerciseStep
          key={exercise.id}
          exercise={exercise}
          outcomes={outcomes}
          position={progress.seen + 1}
          answered={answered}
          submitting={submit.isPending}
          failed={submit.isError}
          onSubmit={(alternativeId, responseSeconds) => {
            const before = topicBefore();
            submit.mutate(
              { alternativeId, responseSeconds },
              {
                onSuccess: (result) =>
                  update((p) => ({
                    ...p,
                    answers: [
                      ...p.answers,
                      {
                        exerciseId: exercise.id,
                        chosenId: alternativeId,
                        result,
                        previousScore: before.score,
                        previousStatus: before.status,
                      },
                    ],
                    unlockSeen: false,
                  })),
              },
            );
          }}
          onContinue={next}
          onExit={onExit}
        />
      )}
      <MasterySheet
        topicName={cachedTopic()?.name}
        topics={answered?.result.unlockedTopics ?? []}
        visible={Boolean(answered && celebrates(answered) && !progress.unlockSeen)}
        onContinue={() => update((p) => ({ ...p, unlockSeen: true }))}
        onSeeTrail={() => {
          update((p) => ({ ...p, unlockSeen: true }));
          onSeeTrail();
        }}
      />
    </>
  );
}

/** A resposta merece a folha se foi ela que dominou o tópico, ou se liberou outros. */
function celebrates({ result, previousStatus }: Answered): boolean {
  const justMastered =
    previousStatus !== null && previousStatus !== 'mastered' && result.topic.status === 'mastered';
  return justMastered || result.unlockedTopics.length > 0;
}
