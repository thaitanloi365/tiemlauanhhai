'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { changePasswordSchema } from '@/lib/utils/validation';
import { strongPasswordGuideline } from '@/lib/utils/password-policy';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const changePasswordFormSchema = changePasswordSchema
  .extend({
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
  })
  .refine((payload) => payload.newPassword === payload.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp.',
    path: ['confirmPassword'],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;

export default function AdminSettingsPage() {
  const [successMessage, setSuccessMessage] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  async function changePassword(values: ChangePasswordFormValues) {
    setSuccessMessage('');
    try {
      const res = await fetch('/api/admin/auth/change-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError('root', {
          message: data.message ?? 'Không thể đổi mật khẩu',
        });
        return;
      }
      setSuccessMessage('Đổi mật khẩu thành công.');
      reset();
    } catch {
      setError('root', {
        message: 'Không thể đổi mật khẩu',
      });
    }
  }

  return (
    <div className="container-shell space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Cài đặt tài khoản</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Đổi mật khẩu cho tài khoản quản trị hiện tại.
        </p>
      </div>

      <div className="max-w-xl rounded-md border border-border bg-card p-4">
        <h2 className="text-lg font-semibold">Đổi mật khẩu</h2>
        <form
          className="mt-3 space-y-3"
          onSubmit={handleSubmit(changePassword)}
          noValidate
        >
          <div className="grid gap-1">
            <Label>Mật khẩu hiện tại</Label>
            <Input
              type="password"
              placeholder="••••••••"
              {...register('currentPassword')}
            />
            {errors.currentPassword?.message ? (
              <p className="text-xs text-destructive">
                {errors.currentPassword.message}
              </p>
            ) : null}
          </div>
          <div className="grid gap-1">
            <Label>Mật khẩu mới</Label>
            <Input
              type="password"
              placeholder="Tối thiểu 8 ký tự"
              {...register('newPassword')}
            />
            <span className="text-xs text-muted-foreground">
              {strongPasswordGuideline}
            </span>
            {errors.newPassword?.message ? (
              <p className="text-xs text-destructive">
                {errors.newPassword.message}
              </p>
            ) : null}
          </div>
          <div className="grid gap-1">
            <Label>Xác nhận mật khẩu mới</Label>
            <Input
              type="password"
              placeholder="Nhập lại mật khẩu mới"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword?.message ? (
              <p className="text-xs text-destructive">
                {errors.confirmPassword.message}
              </p>
            ) : null}
          </div>
          {errors.root?.message ? (
            <p className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-foreground">
              {errors.root.message}
            </p>
          ) : null}
          <Button type="submit" disabled={isSubmitting} className="mt-4">
            {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </Button>
        </form>

        {successMessage ? (
          <p className="mt-3 rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground">
            {successMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}
