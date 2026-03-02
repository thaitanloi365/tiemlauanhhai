'use client';

import Link from 'next/link';
import { useMemo } from 'react';
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
import { useQueryStates, parseAsString } from 'nuqs';
import {
  formatCurrency,
  statusBadgeVariant,
  statusLabel,
} from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
};

const STATUS_OPTIONS = [
  { label: 'Tất cả trạng thái', value: '' },
  { label: 'Chờ xác nhận', value: 'pending' },
  { label: 'Đã xác nhận', value: 'confirmed' },
  { label: 'Đang chuẩn bị', value: 'preparing' },
  { label: 'Đang giao', value: 'shipping' },
  { label: 'Đã giao', value: 'delivered' },
  { label: 'Đã hủy', value: 'cancelled' },
];

export default function AdminOrdersPage() {
  const [filters, setFilters] = useQueryStates({
    status: parseAsString.withDefault(''),
    q: parseAsString.withDefault(''),
  });

  const ordersQuery = useQuery({
    queryKey: ['admin', 'orders', filters.status, filters.q],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.q) params.set('q', filters.q.trim());
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
            {row.original.id.slice(0, 8)}
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
        cell: ({ row }) =>
          new Date(row.original.created_at).toLocaleString('vi-VN'),
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
            value={filters.status || 'all'}
            onValueChange={(value) =>
              setFilters({ status: value === 'all' ? '' : value })
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
            value={filters.q}
            onChange={(e) => setFilters({ q: e.target.value })}
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
