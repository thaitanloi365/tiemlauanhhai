'use client';

import { Input } from '@/components/ui/input';

type Props = {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
  className?: string;
};

function normalizeVietnamPhoneInput(input: string) {
  const digitsOnly = input.replace(/\D/g, '');
  if (!digitsOnly) return '';
  if (digitsOnly.startsWith('84')) return `0${digitsOnly.slice(2, 11)}`;
  if (digitsOnly.startsWith('0')) return digitsOnly.slice(0, 10);
  return `0${digitsOnly.slice(0, 9)}`;
}

function formatVietnamPhone(input: string) {
  const digitsOnly = input.replace(/\D/g, '').slice(0, 10);
  if (digitsOnly.length <= 4) return digitsOnly;
  if (digitsOnly.length <= 7)
    return `${digitsOnly.slice(0, 4)} ${digitsOnly.slice(4)}`;
  return `${digitsOnly.slice(0, 4)} ${digitsOnly.slice(4, 7)} ${digitsOnly.slice(7)}`;
}

export function PhoneInput({
  name = 'phone',
  value,
  onChange,
  placeholder,
  invalid,
  className,
}: Props) {
  return (
    <div
      className={`flex w-full items-center rounded-xl border bg-background ${invalid ? 'border-destructive' : 'border-input'} ${className || ''}`}
    >
      <span
        className={`inline-flex min-h-9 items-center gap-1 border-r px-3 py-1 text-sm font-medium text-muted-foreground ${invalid ? 'border-destructive' : 'border-input'}`}
      >
        <span>🇻🇳</span>
        <span>+84</span>
      </span>
      <Input
        name={name}
        type="tel"
        inputMode="numeric"
        pattern="[0-9 ]*"
        value={formatVietnamPhone(value)}
        onChange={(event) =>
          onChange(normalizeVietnamPhoneInput(event.target.value))
        }
        className="w-full rounded-r-xl border-0 bg-transparent shadow-none focus-visible:ring-0"
        placeholder={placeholder || '0912 345 678'}
        required
      />
    </div>
  );
}
