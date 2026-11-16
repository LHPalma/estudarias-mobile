import { router } from 'expo-router';

import { ReviewDeck } from '@/features/review/ReviewDeck';

export default function ReviewScreen() {
  return <ReviewDeck onBackToTrail={() => router.navigate('/trail')} />;
}
