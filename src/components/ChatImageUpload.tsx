'use client';

import { type ChangeEvent, useEffect, useMemo, useRef } from 'react';
import { CHAT_LIMITS, isAllowedChatImageType } from '@/lib/constants/chat';
import { Button } from '@/components/ui/button';

type ChatImageUploadProps = {
  files: File[];
  disabled?: boolean;
  onFilesChange: (files: File[]) => void;
  onError: (message: string) => void;
  buttonLabel?: string;
  showHint?: boolean;
};

export function ChatImageUpload({
  files,
  disabled,
  onFilesChange,
  onError,
  buttonLabel = 'Upload ảnh',
  showHint = true,
}: ChatImageUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previews = useMemo(
    () =>
      files.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [files],
  );

  useEffect(() => {
    return () => {
      for (const preview of previews) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [previews]);

  const onPickFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(event.target.files ?? []);
    if (incoming.length === 0) return;

    const nextFiles = [...files, ...incoming];
    if (nextFiles.length > CHAT_LIMITS.MAX_IMAGES_PER_MESSAGE) {
      onError(`Mỗi tin nhắn chỉ gửi tối đa ${CHAT_LIMITS.MAX_IMAGES_PER_MESSAGE} ảnh`);
      event.target.value = '';
      return;
    }

    for (const file of incoming) {
      if (!isAllowedChatImageType(file.type)) {
        onError('Chỉ hỗ trợ JPG, PNG, WEBP hoặc GIF');
        event.target.value = '';
        return;
      }
      if (file.size > CHAT_LIMITS.MAX_IMAGE_SIZE_BYTES) {
        onError('Mỗi ảnh tối đa 5MB');
        event.target.value = '';
        return;
      }
    }

    onFilesChange(nextFiles);
    event.target.value = '';
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, fileIndex) => fileIndex !== index));
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={CHAT_LIMITS.ALLOWED_IMAGE_TYPES.join(',')}
        multiple
        className="hidden"
        onChange={onPickFiles}
        disabled={disabled}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || files.length >= CHAT_LIMITS.MAX_IMAGES_PER_MESSAGE}
      >
        {buttonLabel}
      </Button>
      {files.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {previews.map((preview, index) => (
            <div
              key={`${preview.file.name}-${index}`}
              className="relative overflow-hidden rounded-md border"
            >
              <img
                src={preview.url}
                alt={preview.file.name}
                className="h-20 w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute right-1 top-1 rounded bg-black/70 px-1 text-xs text-white"
                disabled={disabled}
              >
                x
              </button>
            </div>
          ))}
        </div>
      ) : null}
      {showHint ? (
        <p className="text-xs text-muted-foreground">Toi da 3 anh, moi anh toi da 5MB.</p>
      ) : null}
    </div>
  );
}
