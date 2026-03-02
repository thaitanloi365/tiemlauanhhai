'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type Props = {
  onSubmit: (rating: number, comment: string) => Promise<void> | void;
  disabled?: boolean;
};

export function ReviewForm({ onSubmit, disabled = false }: Props) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await onSubmit(rating, comment);
      setComment('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-surface p-4">
      <h3 className="text-lg font-semibold">Đánh giá đơn hàng</h3>
      <div className="mt-3 flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Button
            key={star}
            type="button"
            variant={star <= rating ? 'default' : 'outline'}
            size="icon"
            className="rounded-full"
            onClick={() => setRating(star)}
            disabled={disabled || loading}
          >
            ★
          </Button>
        ))}
      </div>
      <Textarea
        className="mt-3 h-24 w-full"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Chia sẻ trải nghiệm món ăn..."
        disabled={disabled || loading}
      />
      <Button
        className="mt-3 w-full"
        type="button"
        onClick={submit}
        disabled={disabled || loading}
      >
        {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
      </Button>
    </div>
  );
}
