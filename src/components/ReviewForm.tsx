'use client';

import { useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { REVIEW_EMOTION_OPTIONS } from '@/lib/constants/review';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type Props = {
  onSubmit: (rating: number, comment: string) => Promise<void> | void;
  disabled?: boolean;
};

const review_form_schema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000, 'Ý kiến tối đa 1000 ký tự'),
});

type ReviewFormValues = z.infer<typeof review_form_schema>;

export function ReviewForm({ onSubmit, disabled = false }: Props) {
  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(review_form_schema),
    defaultValues: {
      rating: 5,
      comment: '',
    },
  });

  const commentValue = watch('comment') ?? '';

  useEffect(() => {
    if (!disabled) return;
    reset(undefined, { keepValues: true });
  }, [disabled, reset]);

  const submit = async (values: ReviewFormValues) => {
    await onSubmit(values.rating, values.comment.trim());
    reset({
      rating: values.rating,
      comment: '',
    });
  };

  return (
    <form className="card-surface p-4" onSubmit={handleSubmit(submit)}>
      <h3 className="text-lg font-semibold">Đánh giá đơn hàng</h3>
      <Controller
        name="rating"
        control={control}
        render={({ field }) => (
          <div className="mt-3 grid grid-cols-5 gap-2">
            {REVIEW_EMOTION_OPTIONS.map((option) => {
              const selected = field.value === option.rating;
              return (
                <button
                  key={option.rating}
                  type="button"
                  onClick={() => field.onChange(option.rating)}
                  disabled={disabled || isSubmitting}
                  className={`rounded-xl border px-2 py-3 transition ${
                    selected
                      ? 'scale-[1.03] border-primary bg-primary/10'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  <div className="text-2xl">{option.emoji}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{option.label}</div>
                </button>
              );
            })}
          </div>
        )}
      />
      <Controller
        name="comment"
        control={control}
        render={({ field }) => (
          <Textarea
            className="mt-3 h-24 w-full"
            value={field.value}
            onChange={field.onChange}
            placeholder="Chia sẻ ý kiến của bạn (không bắt buộc)..."
            disabled={disabled || isSubmitting}
            maxLength={1000}
          />
        )}
      />
      <p className="mt-1 text-right text-xs text-muted-foreground">{commentValue.length}/1000</p>
      {errors.comment?.message ? (
        <p className="mt-1 text-sm text-destructive">{errors.comment.message}</p>
      ) : null}
      <Button
        className="mt-3 w-full"
        type="submit"
        disabled={disabled || isSubmitting}
      >
        {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
      </Button>
    </form>
  );
}
