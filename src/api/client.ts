import type { Http } from './http';
import type {
  AttemptRequest,
  AttemptResult,
  DueReviews,
  Lesson,
  Me,
  ReviewRequest,
  ReviewResult,
  TopicAttempts,
  TopicDetail,
  Trail,
} from './types';

/** As operações que as telas usam. A implementação real fala HTTP; a do modo mock responde do contrato, sem rede. */
export type ApiClient = {
  getMe(): Promise<Me>;
  getTrail(): Promise<Trail>;
  getTopic(topicId: string): Promise<TopicDetail>;
  getTopicAttempts(topicId: string): Promise<TopicAttempts>;
  getLesson(lessonId: string): Promise<Lesson>;
  submitAttempt(exerciseId: string, request: AttemptRequest): Promise<AttemptResult>;
  getDueReviews(): Promise<DueReviews>;
  reviewCard(cardId: string, request: ReviewRequest): Promise<ReviewResult>;
};

export function createHttpApi(http: Http): ApiClient {
  const id = encodeURIComponent;
  return {
    getMe: () => http.get('/me'),
    getTrail: () => http.get('/trail'),
    getTopic: (topicId) => http.get(`/topics/${id(topicId)}`),
    getTopicAttempts: (topicId) => http.get(`/topics/${id(topicId)}/attempts`),
    getLesson: (lessonId) => http.get(`/lessons/${id(lessonId)}`),
    submitAttempt: (exerciseId, request) =>
      http.post(`/exercises/${id(exerciseId)}/attempts`, request),
    getDueReviews: () => http.get('/reviews/due'),
    reviewCard: (cardId, request) => http.post(`/reviews/${id(cardId)}`, request),
  };
}
