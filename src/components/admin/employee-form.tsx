'use client';

import { useEffect, useState } from 'react';
import {
  isStrongPassword,
  strongPasswordGuideline,
} from '@/lib/utils/password-policy';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'super_admin' | 'manager'>('manager');
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!open) return;
    setEmail(employee?.email ?? '');
    setPassword('');
    setRole(employee?.role ?? roleOptions[0]?.value ?? 'manager');
    setDisplayName(employee?.display_name ?? '');
    setMessage('');
  }, [open, employee, roleOptions]);

  async function save() {
    if (mode === 'create' && !isStrongPassword(password)) {
      setMessage(strongPasswordGuideline);
      return;
    }

    setSaving(true);
    setMessage('');

    const payload =
      mode === 'create'
        ? { email, password, role, displayName: displayName || null }
        : { role, displayName: displayName || null };
    const endpoint =
      mode === 'create'
        ? '/api/admin/employees'
        : `/api/admin/employees/${employee?.id}`;
    const method = mode === 'create' ? 'POST' : 'PATCH';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message ?? 'Không thể lưu nhân viên');
        return;
      }
      onSaved?.();
      onClose();
    } finally {
      setSaving(false);
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

        <div className="mt-4 grid gap-3">
          <div className="grid gap-1">
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              disabled={mode === 'edit'}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="employee@example.com"
              className="disabled:bg-muted"
            />
          </div>

          {mode === 'create' ? (
            <div className="grid gap-1">
              <Label>Mật khẩu</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự"
              />
              <span className="text-xs text-muted-foreground">
                {strongPasswordGuideline}
              </span>
            </div>
          ) : null}

          <div className="grid gap-1">
            <Label>Tên hiển thị</Label>
            <Input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ví dụ: Quản lý ca sáng"
            />
          </div>

          <div className="grid gap-1">
            <Label>Vai trò</Label>
            <Select
              value={role}
              onValueChange={(value) =>
                setRole(value as 'super_admin' | 'manager')
              }
            >
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
          </div>
        </div>

        {message ? (
          <p className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-foreground">
            {message}
          </p>
        ) : null}

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Hủy
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
