import type { Http } from './http';
import type {
  AttemptRequest,
  AttemptResult,
  DueReviews,
  Lesson,
  ReviewRequest,
  ReviewResult,
  TopicDetail,
  Trail,
} from './types';

/** As operações que as telas usam. A implementação real fala HTTP; a do modo mock responde do contrato, sem rede. */
export type ApiClient = {
  getTrail(): Promise<Trail>;
  getTopic(topicId: string): Promise<TopicDetail>;
  getLesson(lessonId: string): Promise<Lesson>;
  submitAttempt(exerciseId: string, request: AttemptRequest): Promise<AttemptResult>;
  getDueReviews(): Promise<DueReviews>;
  reviewCard(cardId: string, request: ReviewRequest): Promise<ReviewResult>;
};

export function createHttpApi(http: Http): ApiClient {
  const id = encodeURIComponent;
  return {
    getTrail: () => http.get('/trail'),
    getTopic: (topicId) => http.get(`/topics/${id(topicId)}`),
    getLesson: (lessonId) => http.get(`/lessons/${id(lessonId)}`),
    submitAttempt: (exerciseId, request) =>
      http.post(`/exercises/${id(exerciseId)}/attempts`, request),
    getDueReviews: () => http.get('/reviews/due'),
    reviewCard: (cardId, request) => http.post(`/reviews/${id(cardId)}`, request),
  };
}
