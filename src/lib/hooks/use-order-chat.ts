'use client';

import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { browserSupabase, hasSupabaseBrowserConfig } from '@/lib/supabase';

type CustomerActor = {
  role: 'customer';
  sessionId: string;
};

type AdminActor = {
  role: 'admin';
};

type UseOrderChatOptions = {
  orderId: string;
  actor: CustomerActor | AdminActor;
};

type MessagesResponse = {
  messages: AppTypes.OrderMessage[];
  readonly?: boolean;
  has_unread_for_customer?: boolean;
  has_unread_for_admin?: boolean;
};

type SendMessageInput = {
  content?: string;
  images?: string[];
};

function getQueryKey(options: UseOrderChatOptions) {
  if (options.actor.role === 'customer') {
    return ['order-chat', options.orderId, options.actor.role, options.actor.sessionId];
  }
  return ['order-chat', options.orderId, options.actor.role];
}

function getMessagesEndpoint(options: UseOrderChatOptions) {
  if (options.actor.role === 'customer') {
    const params = new URLSearchParams({
      sessionId: options.actor.sessionId,
    });
    return `/api/orders/${options.orderId}/messages?${params.toString()}`;
  }
  return `/api/admin/orders/${options.orderId}/messages`;
}

function getUploadEndpoint(options: UseOrderChatOptions) {
  if (options.actor.role === 'customer') {
    return `/api/orders/${options.orderId}/messages/upload`;
  }
  return `/api/admin/orders/${options.orderId}/messages/upload`;
}

function getReadEndpoint(options: UseOrderChatOptions) {
  if (options.actor.role === 'customer') {
    return `/api/orders/${options.orderId}/messages/read`;
  }
  return `/api/admin/orders/${options.orderId}/messages/read`;
}

export function useOrderChat(options: UseOrderChatOptions) {
  const { orderId, actor } = options;
  const queryClient = useQueryClient();
  const actorSessionId = actor.role === 'customer' ? actor.sessionId : '';
  const queryKey = useMemo(
    () =>
      actor.role === 'customer'
        ? (['order-chat', orderId, actor.role, actorSessionId] as const)
        : (['order-chat', orderId, actor.role] as const),
    [orderId, actor.role, actorSessionId],
  );
  const messagesEndpoint = getMessagesEndpoint({ orderId, actor });
  const uploadEndpoint = getUploadEndpoint({ orderId, actor });
  const readEndpoint = getReadEndpoint({ orderId, actor });

  const messagesQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch(messagesEndpoint);
      const data = (await res.json()) as MessagesResponse & { message?: string };
      if (!res.ok) throw new Error(data.message ?? 'Không tải được tin nhắn');
      return data;
    },
    enabled: Boolean(orderId),
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (input: SendMessageInput) => {
      const endpoint =
        actor.role === 'customer'
          ? `/api/orders/${orderId}/messages`
          : `/api/admin/orders/${orderId}/messages`;
      const payload =
        actor.role === 'customer'
          ? {
              sessionId: actor.sessionId,
              content: input.content,
              images: input.images ?? [],
            }
          : {
              content: input.content,
              images: input.images ?? [],
            };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(data.message ?? 'Không gửi được tin nhắn');
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  const uploadImagesMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      for (const file of files) formData.append('files', file);
      if (actor.role === 'customer') {
        formData.append('sessionId', actor.sessionId);
      }
      const res = await fetch(uploadEndpoint, {
        method: 'POST',
        body: formData,
      });
      const data = (await res.json()) as { urls?: string[]; message?: string };
      if (!res.ok) throw new Error(data.message ?? 'Không upload được ảnh');
      return data.urls ?? [];
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async () => {
      const payload =
        actor.role === 'customer'
          ? { sessionId: actor.sessionId }
          : {};
      const res = await fetch(readEndpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(data.message ?? 'Không thể cập nhật trạng thái đã đọc');
      return true;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  useEffect(() => {
    if (!hasSupabaseBrowserConfig() || !orderId) return;

    const channel = browserSupabase
      .channel(`order-chat:${orderId}:${actor.role}:${actorSessionId || 'admin'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_messages',
          filter: `order_id=eq.${orderId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey });
        },
      )
      .subscribe();

    return () => {
      void browserSupabase.removeChannel(channel);
    };
  }, [orderId, actor.role, actorSessionId, queryClient, queryKey]);

  return {
    messages: messagesQuery.data?.messages ?? [],
    readonly: Boolean(messagesQuery.data?.readonly),
    hasUnread:
      actor.role === 'customer'
        ? Boolean(messagesQuery.data?.has_unread_for_customer)
        : Boolean(messagesQuery.data?.has_unread_for_admin),
    isLoading: messagesQuery.isLoading,
    isError: messagesQuery.isError,
    error: messagesQuery.error,
    sendMessage: sendMessageMutation.mutateAsync,
    uploadImages: uploadImagesMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
    isUploading: uploadImagesMutation.isPending,
    markAsRead: markReadMutation.mutateAsync,
    refetch: messagesQuery.refetch,
  };
}
