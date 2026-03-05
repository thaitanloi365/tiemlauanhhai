export const REVIEW_EMOTION_OPTIONS = [
  { rating: 1, emoji: '😠', label: 'Rất tệ' },
  { rating: 2, emoji: '😕', label: 'Không hài lòng' },
  { rating: 3, emoji: '😐', label: 'Bình thường' },
  { rating: 4, emoji: '🙂', label: 'Hài lòng' },
  { rating: 5, emoji: '😍', label: 'Tuyệt vời' },
] as const;

export function getReviewEmotionByRating(rating: number) {
  return (
    REVIEW_EMOTION_OPTIONS.find((option) => option.rating === rating) ??
    REVIEW_EMOTION_OPTIONS[REVIEW_EMOTION_OPTIONS.length - 1]
  );
}
