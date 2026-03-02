'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  employeeSchema,
  employeeUpdateSchema,
} from '@/lib/utils/validation';
import { strongPasswordGuideline } from '@/lib/utils/password-policy';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const employeeCreateFormSchema = employeeSchema.extend({
  mode: z.literal('create'),
});

const employeeEditFormSchema = employeeUpdateSchema.extend({
  mode: z.literal('edit'),
  email: z.string().optional(),
  password: z.string().optional(),
});

const employeeFormSchema = z.discriminatedUnion('mode', [
  employeeCreateFormSchema,
  employeeEditFormSchema,
]);

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

type Employee = {
  id: string;
  email: string;
  role: 'super_admin' | 'manager';
  display_name?: string | null;
};

type RoleOption = {
  value: 'super_admin' | 'manager';
  label: string;
};

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  employee?: Employee | null;
  roleOptions: RoleOption[];
  onClose: () => void;
  onSaved?: () => void;
};

export function EmployeeForm({
  open,
  mode,
  employee,
  roleOptions,
  onClose,
  onSaved,
}: Props) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      mode: 'create',
      email: '',
      password: '',
      role: 'manager',
      displayName: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      mode,
      email: employee?.email ?? '',
      password: '',
      role: employee?.role ?? roleOptions[0]?.value ?? 'manager',
      displayName: employee?.display_name ?? '',
    });
  }, [open, employee, roleOptions, mode, reset]);

  async function save(values: EmployeeFormValues) {
    clearErrors('root');

    const payload =
      values.mode === 'create'
        ? {
            email: values.email,
            password: values.password,
            role: values.role,
            displayName: values.displayName || null,
          }
        : { role: values.role, displayName: values.displayName || null };
    const endpoint =
      values.mode === 'create'
        ? '/api/admin/employees'
        : `/api/admin/employees/${employee?.id}`;
    const method = values.mode === 'create' ? 'POST' : 'PATCH';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError('root', {
          type: 'server',
          message: data.message ?? 'Không thể lưu nhân viên',
        });
        return;
      }
      onSaved?.();
      onClose();
    } catch {
      setError('root', {
        type: 'server',
        message: 'Không thể lưu nhân viên',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Thêm nhân viên' : 'Chỉnh sửa nhân viên'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Tạo tài khoản quản trị mới.'
              : 'Cập nhật vai trò hoặc tên hiển thị.'}
          </DialogDescription>
        </DialogHeader>

        <form
          id="employee-form"
          className="mt-4 grid gap-3"
          onSubmit={handleSubmit(save)}
          noValidate
        >
          <input type="hidden" {...register('mode')} />
          <div className="grid gap-1">
            <Label>Email</Label>
            <Input
              type="email"
              disabled={mode === 'edit'}
              placeholder="employee@example.com"
              className="disabled:bg-muted"
              {...register('email')}
            />
            {errors.email?.message ? (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            ) : null}
          </div>

          {mode === 'create' ? (
            <div className="grid gap-1">
              <Label>Mật khẩu</Label>
              <Input
                type="password"
                placeholder="Tối thiểu 8 ký tự"
                {...register('password')}
              />
              <span className="text-xs text-muted-foreground">
                {strongPasswordGuideline}
              </span>
              {errors.password?.message ? (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-1">
            <Label>Tên hiển thị</Label>
            <Input
              type="text"
              placeholder="Ví dụ: Quản lý ca sáng"
              {...register('displayName')}
            />
            {errors.displayName?.message ? (
              <p className="text-xs text-destructive">
                {errors.displayName.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-1">
            <Label>Vai trò</Label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role?.message ? (
              <p className="text-xs text-destructive">{errors.role.message}</p>
            ) : null}
          </div>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </form>

        {errors.root?.message ? (
          <p className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-foreground">
            {errors.root.message}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
