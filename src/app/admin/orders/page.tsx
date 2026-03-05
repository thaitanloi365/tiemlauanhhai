'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { MessageCircle, Smile } from 'lucide-react';
import { useQueryStates, parseAsString } from 'nuqs';
import {
  formatCurrency,
  statusBadgeVariant,
  statusLabel,
} from '@/lib/utils/format';
import { ORDER_STATUS_OPTIONS } from '@/lib/constants/order';
import { formatDateTimeVi } from '@/lib/date';
import { isChatReadonlyByOrderStatus } from '@/lib/constants/chat';
import { getReviewEmotionByRating } from '@/lib/constants/review';
import { ChatBox } from '@/components/ChatBox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type AdminOrder = {
  id: string;
  customer_name: string;
  phone: string;
  total_amount: number;
  status: string;
  created_at: string;
  has_review?: boolean;
  has_chat?: boolean;
  has_unread_for_admin?: boolean;
};

const STATUS_OPTIONS = [
  { label: 'Tất cả trạng thái', value: '' },
  ...ORDER_STATUS_OPTIONS,
];

export default function AdminOrdersPage() {
  const [f, setF] = useQueryStates({
    s: parseAsString.withDefault(''),
    q: parseAsString.withDefault(''),
  });

  const ordersQuery = useQuery({
    queryKey: ['admin', 'orders', f.s, f.q],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (f.s) params.set('status', f.s);
      if (f.q) params.set('q', f.q.trim());
      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message ?? 'Không tải được danh sách đơn');
      return (data.orders ?? []) as AdminOrder[];
    },
  });

  const columns = useMemo<ColumnDef<AdminOrder>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'Mã',
        cell: ({ row }) => (
          <Link
            href={`/admin/orders/${row.original.id}`}
            className="text-primary underline"
          >
            {row.original.id.slice(0, 8).toUpperCase()}
          </Link>
        ),
      },
      {
        id: 'customer',
        header: 'Khách',
        cell: ({ row }) => (
          <div className="whitespace-pre-line">
            {row.original.customer_name}
            {'\n'}
            {row.original.phone}
          </div>
        ),
      },
      {
        accessorKey: 'total_amount',
        header: 'Tổng',
        cell: ({ row }) => formatCurrency(row.original.total_amount),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: ({ row }) => (
          <Badge variant={statusBadgeVariant(row.original.status)}>
            {statusLabel(row.original.status)}
          </Badge>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Ngày đặt',
        cell: ({ row }) => formatDateTimeVi(row.original.created_at),
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => <AdminOrderRowActions order={row.original} />,
      },
    ],
    [],
  );

  const data = ordersQuery.data ?? [];
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: [] as SortingState,
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="container-shell space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-bold">Quản lý đơn hàng</h1>
        <div className="flex flex-wrap gap-2">
          <Select
            value={f.s || 'all'}
            onValueChange={(value) =>
              setF({ s: value === 'all' ? '' : value })
            }
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value || 'all'}
                  value={option.value || 'all'}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={f.q}
            onChange={(e) => setF({ q: e.target.value })}
            placeholder="Tìm tên / SĐT"
            className="w-[220px]"
          />
        </div>
      </div>

      {ordersQuery.isPending ? (
        <div className="rounded-md border p-4 text-sm text-muted-foreground">
          Đang tải dữ liệu...
        </div>
      ) : ordersQuery.isError ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-foreground">
          {ordersQuery.error.message}
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-md border p-6 text-center">
          <p className="text-base font-medium">Chưa có đơn hàng nào</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Không có dữ liệu phù hợp với bộ lọc hiện tại.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="min-w-full text-sm">
              <thead className="border-b bg-muted/60 text-left">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-3 py-2 font-medium">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2 align-top">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function AdminOrderRowActions({ order }: { order: AdminOrder }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const reviewQuery = useQuery({
    queryKey: ['admin', 'orders', 'review-by-order', order.id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/orders/${order.id}`);
      const data = (await res.json()) as {
        message?: string;
        review?: AppTypes.Review | null;
      };
      if (!res.ok) {
        throw new Error(data.message ?? 'Không tải được đánh giá của đơn.');
      }
      return data.review ?? null;
    },
    enabled: reviewOpen && Boolean(order.has_review),
  });

  const review = reviewQuery.data;

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="relative"
          aria-label="Mở chat đơn hàng"
          title="Mở chat"
          onClick={() => setChatOpen(true)}
        >
          <MessageCircle />
          {order.has_unread_for_admin ? (
            <span className="absolute right-1 top-1 size-2 rounded-full bg-destructive" />
          ) : null}
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label="Xem đánh giá đơn hàng"
          title="Xem đánh giá"
          disabled={!order.has_review}
          onClick={() => setReviewOpen(true)}
        >
          <Smile />
        </Button>
      </div>

      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="max-w-2xl">
          <div className="min-h-0 overflow-hidden">
            <ChatBox
              key={order.id}
              orderId={order.id}
              senderType="admin"
              readonly={isChatReadonlyByOrderStatus(order.status)}
              title="Chat với khách hàng"
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Đánh giá đơn hàng</DialogTitle>
            <DialogDescription>
              Mã đơn {order.id.slice(0, 8).toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          {reviewQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải đánh giá...</p>
          ) : reviewQuery.isError ? (
            <p className="text-sm text-destructive">{reviewQuery.error.message}</p>
          ) : review ? (
            <div className="rounded-md border border-border bg-muted/40 p-4">
              <p className="text-2xl">{getReviewEmotionByRating(review.rating).emoji}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {getReviewEmotionByRating(review.rating).label}
              </p>
              <p className="mt-2 text-sm">
                {review.comment || 'Khách chưa để lại nhận xét.'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              Đơn hàng này chưa có đánh giá từ khách.
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setReviewOpen(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
