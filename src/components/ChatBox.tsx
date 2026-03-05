'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, SendHorizontal, Smile } from 'lucide-react';
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';
import { useOrderChat } from '@/lib/hooks/use-order-chat';
import { CHAT_LIMITS, isAllowedChatImageType } from '@/lib/constants/chat';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';

type ChatBoxProps =
  | {
      orderId: string;
      senderType: 'customer';
      sessionId: string;
      readonly?: boolean;
      title?: string;
    }
  | {
      orderId: string;
      senderType: 'admin';
      readonly?: boolean;
      title?: string;
    };

function toDateKey(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function formatDateSeparator(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

export function ChatBox(props: ChatBoxProps) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [visibleCount, setVisibleCount] = useState(30);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const loadingOlderRef = useRef<{
    prevScrollHeight: number;
    prevScrollTop: number;
  } | null>(null);
  const actor =
    props.senderType === 'customer'
      ? { role: 'customer' as const, sessionId: props.sessionId }
      : { role: 'admin' as const };
  const chat = useOrderChat({
    orderId: props.orderId,
    actor,
  });

  const isReadonly = Boolean(props.readonly || chat.readonly);
  const isBusy = chat.isSending || chat.isUploading;
  const canSend = useMemo(
    () =>
      !isReadonly && !isBusy && (text.trim().length > 0 || files.length > 0),
    [isReadonly, isBusy, text, files.length],
  );
  const totalMessages = chat.messages.length;
  const visibleMessages = useMemo(() => {
    if (visibleCount >= totalMessages) return chat.messages;
    return chat.messages.slice(totalMessages - visibleCount);
  }, [chat.messages, totalMessages, visibleCount]);

  useEffect(() => {
    if (!chat.hasUnread) return;
    void chat.markAsRead().catch(() => undefined);
  }, [chat.hasUnread, chat.markAsRead]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !shouldStickToBottomRef.current) return;
    container.scrollTop = container.scrollHeight;
  }, [visibleMessages.length, chat.isLoading]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !loadingOlderRef.current) return;
    const { prevScrollHeight, prevScrollTop } = loadingOlderRef.current;
    const nextScrollHeight = container.scrollHeight;
    container.scrollTop = prevScrollTop + (nextScrollHeight - prevScrollHeight);
    loadingOlderRef.current = null;
  }, [visibleMessages.length]);

  useEffect(() => {
    const composer = composerRef.current;
    if (!composer) return;
    composer.style.height = '0px';
    const lineHeight = Number.parseFloat(getComputedStyle(composer).lineHeight || '20');
    const maxHeight = lineHeight * 5;
    const nextHeight = Math.min(composer.scrollHeight, maxHeight);
    composer.style.height = `${nextHeight}px`;
    composer.style.overflowY = composer.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [text]);

  const appendEmoji = (emojiData: EmojiClickData) => {
    setText((previous) => `${previous}${emojiData.emoji}`);
    setIsEmojiPickerOpen(false);
  };

  const pickImages = (event: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(event.target.files ?? []);
    if (incoming.length === 0) return;

    const nextFiles = [...files, ...incoming];
    if (nextFiles.length > CHAT_LIMITS.MAX_IMAGES_PER_MESSAGE) {
      setErrorMessage(
        `Mỗi tin nhắn chỉ gửi tối đa ${CHAT_LIMITS.MAX_IMAGES_PER_MESSAGE} ảnh`,
      );
      event.target.value = '';
      return;
    }

    for (const file of incoming) {
      if (!isAllowedChatImageType(file.type)) {
        setErrorMessage('Chỉ hỗ trợ JPG, PNG, WEBP hoặc GIF');
        event.target.value = '';
        return;
      }
      if (file.size > CHAT_LIMITS.MAX_IMAGE_SIZE_BYTES) {
        setErrorMessage('Mỗi ảnh tối đa 5MB');
        event.target.value = '';
        return;
      }
    }

    setFiles(nextFiles);
    setErrorMessage('');
    event.target.value = '';
  };

  const sendMessage = async () => {
    if (!canSend) return;
    setErrorMessage('');
    try {
      let imageUrls: string[] = [];
      if (files.length > 0) {
        imageUrls = await chat.uploadImages(files);
      }
      await chat.sendMessage({
        content: text.trim(),
        images: imageUrls,
      });
      setText('');
      setFiles([]);
    } catch (error) {
      setErrorMessage((error as Error).message || 'Không gửi được tin nhắn');
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col gap-2">
      {props.title ? (
        <div className="items-center justify-between">
          <h3 className="text-lg font-semibold">{props.title}</h3>
        </div>
      ) : null}

      {chat.isLoading ? (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-md border bg-background">
          <p className="text-sm text-muted-foreground">Đang tải hội thoại...</p>
        </div>
      ) : (
        <div
          ref={messagesContainerRef}
          className="min-h-0 flex-1 flex flex-col gap-3 overflow-y-auto rounded-md border bg-background p-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={(event) => {
            const container = event.currentTarget;
            const distanceToBottom =
              container.scrollHeight -
              (container.scrollTop + container.clientHeight);
            shouldStickToBottomRef.current = distanceToBottom < 40;
            if (
              container.scrollTop < 24 &&
              visibleCount < totalMessages &&
              !loadingOlderRef.current
            ) {
              loadingOlderRef.current = {
                prevScrollHeight: container.scrollHeight,
                prevScrollTop: container.scrollTop,
              };
              setVisibleCount((previous) =>
                Math.min(previous + 20, totalMessages),
              );
            }
          }}
        >
          {visibleCount < totalMessages ? (
            <div className="flex justify-center">
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                Kéo lên để xem thêm tin cũ
              </span>
            </div>
          ) : null}
          {visibleMessages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Chưa có tin nhắn nào.
            </p>
          ) : (
            visibleMessages.map((message, index) => {
              const isMine = message.sender_type === props.senderType;
              const previousMessage =
                index > 0 ? visibleMessages[index - 1] : null;
              const shouldShowDateSeparator =
                !previousMessage ||
                toDateKey(previousMessage.created_at) !==
                  toDateKey(message.created_at);
              return (
                <div key={message.id}>
                  {shouldShowDateSeparator ? (
                    <div className="my-2 flex items-center justify-center">
                      <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                        {formatDateSeparator(message.created_at)}
                      </span>
                    </div>
                  ) : null}
                  <div
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="max-w-[82%]">
                      <div
                        className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                          isMine
                            ? 'rounded-br-md bg-primary text-primary-foreground'
                            : 'rounded-bl-md bg-muted text-foreground'
                        }`}
                      >
                        {message.content ? (
                          <p className="whitespace-pre-wrap">
                            {message.content}
                          </p>
                        ) : null}
                        {message.images?.length ? (
                          <div className="mt-2 grid grid-cols-3 gap-2">
                            {message.images.map((url) => (
                              <a
                                key={url}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="block overflow-hidden rounded-md border bg-background"
                              >
                                <img
                                  src={url}
                                  alt="chat"
                                  className="h-20 w-full object-cover"
                                />
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <p
                        className={`mt-1 text-[11px] text-muted-foreground ${
                          isMine ? 'text-right' : 'text-left'
                        }`}
                      >
                        {formatMessageTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {isReadonly ? (
        <p className="text-sm text-muted-foreground">
          Đơn hàng đã hoàn tất. Bạn chỉ có thể xem lại lịch sử chat.
        </p>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 rounded-md border bg-background p-1.5">
            <label className="inline-flex">
              <input
                type="file"
                accept={CHAT_LIMITS.ALLOWED_IMAGE_TYPES.join(',')}
                multiple
                className="hidden"
                onChange={pickImages}
                disabled={
                  isBusy || files.length >= CHAT_LIMITS.MAX_IMAGES_PER_MESSAGE
                }
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-8"
                disabled={
                  isBusy || files.length >= CHAT_LIMITS.MAX_IMAGES_PER_MESSAGE
                }
                asChild
              >
                <span aria-label="Upload ảnh">
                  <ImagePlus className="size-4" />
                </span>
              </Button>
            </label>
            <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  disabled={isBusy}
                  aria-label="Mở bảng chọn emoji"
                >
                  <Smile className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <EmojiPicker
                  onEmojiClick={appendEmoji}
                  autoFocusSearch={false}
                  lazyLoadEmojis
                  searchDisabled
                  skinTonesDisabled
                  previewConfig={{ showPreview: false }}
                />
              </PopoverContent>
            </Popover>

            <Textarea
              ref={composerRef}
              rows={1}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Nhập tin nhắn..."
              disabled={isBusy}
              maxLength={CHAT_LIMITS.MAX_TEXT_LENGTH}
              className="min-h-0 resize-none border-0 bg-transparent px-2 py-1 shadow-none focus-visible:ring-0"
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
            />

            <Button
              type="button"
              size="icon"
              className="size-8"
              onClick={sendMessage}
              disabled={!canSend}
              aria-label="Gửi tin nhắn"
            >
              <SendHorizontal className="size-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {files.length > 0
                ? `Đã chọn ${files.length}/${CHAT_LIMITS.MAX_IMAGES_PER_MESSAGE} ảnh`
                : 'Tối đa 3 ảnh, mỗi ảnh 5MB'}
            </span>
            <span>
              {text.length}/{CHAT_LIMITS.MAX_TEXT_LENGTH}
            </span>
          </div>
        </div>
      )}

      {errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : null}
      {chat.isError ? (
        <p className="text-sm text-destructive">
          {(chat.error as Error).message || 'Không tải được hội thoại'}
        </p>
      ) : null}
    </section>
  );
}
