'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { adminLoginSchema } from '@/lib/utils/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function login(values: AdminLoginFormValues) {
    setMessage('');
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message ?? 'Không đăng nhập được');
        return;
      }
      router.push('/admin');
      router.refresh();
    } catch {
      setMessage('Không đăng nhập được');
    }
  }

  return (
    <div className="container-shell flex min-h-dvh items-center justify-center py-10">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-sm">
        <h1 className="text-2xl font-semibold">Admin Login</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chỉ tài khoản admin hợp lệ mới truy cập được trang quản trị.
        </p>
        <form className="mt-4 grid gap-3" onSubmit={handleSubmit(login)} noValidate>
          <div className="grid gap-1">
            <Label>Email</Label>
            <Input type="email" placeholder="you@example.com" {...register('email')} />
            {errors.email?.message ? (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            ) : null}
          </div>
          <div className="grid gap-1">
            <Label>Mật khẩu</Label>
            <Input
              type="password"
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password?.message ? (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            ) : null}
          </div>
          <Button type="submit" disabled={isSubmitting} className="mt-4 w-full">
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
        </form>
        {message ? (
          <p className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-foreground">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
