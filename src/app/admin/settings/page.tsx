'use client';

import { useState } from 'react';
import {
  isStrongPassword,
  strongPasswordGuideline,
} from '@/lib/utils/password-policy';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  async function changePassword() {
    setErrorMessage('');
    setSuccessMessage('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (!isStrongPassword(newPassword)) {
      setErrorMessage(strongPasswordGuideline);
      return;
    }
    if (newPassword === currentPassword) {
      setErrorMessage('Mật khẩu mới phải khác mật khẩu hiện tại.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth/change-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.message ?? 'Không thể đổi mật khẩu');
        return;
      }
      setSuccessMessage('Đổi mật khẩu thành công.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } finally {
      setLoading(false);
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
        <div className="mt-3 space-y-3">
          <div className="grid gap-1">
            <Label>Mật khẩu hiện tại</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="grid gap-1">
            <Label>Mật khẩu mới</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Tối thiểu 8 ký tự"
            />
            <span className="text-xs text-muted-foreground">
              {strongPasswordGuideline}
            </span>
          </div>
          <div className="grid gap-1">
            <Label>Xác nhận mật khẩu mới</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !loading) changePassword();
              }}
            />
          </div>
        </div>

        {errorMessage ? (
          <p className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-foreground">
            {errorMessage}
          </p>
        ) : null}
        {successMessage ? (
          <p className="mt-3 rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground">
            {successMessage}
          </p>
        ) : null}

        <Button
          type="button"
          onClick={changePassword}
          disabled={loading}
          className="mt-4"
        >
          {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
        </Button>
      </div>
    </div>
  );
}
