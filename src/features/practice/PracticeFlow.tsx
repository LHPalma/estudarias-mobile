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
import { usePracticeProgress } from './progress';
import { UnlockSheet } from './UnlockSheet';

type Props = {
  lesson: Lesson;
  onExit: () => void;
  onSeeTrail: () => void;
  onReview: () => void;
};

/**
 * A prática de uma lição, do primeiro exercício ao resumo. Cada resposta vai para a API na hora; o retorno decide o que
 * vem depois: a faixa de acerto, a tela do erro, a folha de desbloqueio (se a resposta liberou tópicos) e, no fim, o resumo.
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

  /** A nota do tópico antes de responder: a da última resposta desta sessão, ou a que o app já tinha em cache. */
  const scoreBefore = (): number | null => {
    const last = progress.answers[progress.answers.length - 1];
    if (last) {
      return last.result.topic.score;
    }
    const topic = queryClient.getQueryData<TopicDetail>(queryKeys.topic(lesson.topicId));
    if (topic) {
      return topic.score;
    }
    const trail = queryClient.getQueryData<Trail>(queryKeys.trail);
    return trail?.topics.find((item) => item.id === lesson.topicId)?.score ?? null;
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
            const previousScore = scoreBefore();
            submit.mutate(
              { alternativeId, responseSeconds },
              {
                onSuccess: (result) =>
                  update((p) => ({
                    ...p,
                    answers: [
                      ...p.answers,
                      { exerciseId: exercise.id, chosenId: alternativeId, result, previousScore },
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
      <UnlockSheet
        topics={answered?.result.unlockedTopics ?? []}
        visible={Boolean(
          answered && answered.result.unlockedTopics.length > 0 && !progress.unlockSeen,
        )}
        onContinue={() => update((p) => ({ ...p, unlockSeen: true }))}
        onSeeTrail={() => {
          update((p) => ({ ...p, unlockSeen: true }));
          onSeeTrail();
        }}
      />
    </>
  );
}
