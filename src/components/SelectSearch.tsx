'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type SelectSearchOption = {
  value: string;
  label: string;
  keywords?: string[];
};

type Props = {
  value: string;
  options: SelectSearchOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
};

export function SelectSearch({
  value,
  options,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  name,
  disabled,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = options.find((entry) => entry.value === value);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return options;
    return options.filter((entry) => {
      const inLabel = entry.label.toLowerCase().includes(keyword);
      const inKeywords = (entry.keywords || []).some((k) =>
        k.toLowerCase().includes(keyword),
      );
      return inLabel || inKeywords;
    });
  }, [options, search]);

  return (
    <div className="relative">
      <Button
        type="button"
        name={name}
        disabled={disabled}
        variant="outline"
        className={`w-full justify-start text-left font-normal ${className || ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        {selected?.label || placeholder || 'Chọn mục'}
      </Button>
      {open ? (
        <div className="absolute z-30 mt-1 w-full rounded-md border bg-background p-2 shadow-lg">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder || 'Tìm kiếm...'}
            className="mb-2 w-full"
          />
          <div className="max-h-56 overflow-auto">
            {filtered.length === 0 ? (
              <p className="px-2 py-1 text-sm text-muted-foreground">
                {emptyText || 'Không tìm thấy kết quả phù hợp.'}
              </p>
            ) : (
              filtered.map((entry) => (
                <Button
                  type="button"
                  key={entry.value}
                  variant="ghost"
                  size="sm"
                  className="block w-full justify-start px-2 text-left"
                  onClick={() => {
                    onChange(entry.value);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  {entry.label}
                </Button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
