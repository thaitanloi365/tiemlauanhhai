'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { parseAsString, useQueryStates } from 'nuqs';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency, statusLabel } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type StatisticsResponse = {
  revenue: {
    monthly: Array<{ month: number; total: number; count: number }>;
    total: number;
  };
  ordersByArea: {
    byDistrict: Array<{ district: string; count: number; total: number }>;
    byWard: Array<{
      district: string;
      ward: string;
      count: number;
      total: number;
    }>;
  };
  summary: {
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
  };
};

const MONTH_OPTIONS = [{ label: 'Cả năm', value: '' }].concat(
  Array.from({ length: 12 }, (_, index) => ({
    label: `Tháng ${index + 1}`,
    value: String(index + 1),
  })),
);

const STATUS_OPTIONS = [
  { label: 'Tất cả trạng thái', value: '' },
  { label: 'Chờ xác nhận', value: 'pending' },
  { label: 'Đã xác nhận', value: 'confirmed' },
  { label: 'Đang chuẩn bị', value: 'preparing' },
  { label: 'Đang giao', value: 'shipping' },
  { label: 'Đã giao', value: 'delivered' },
  { label: 'Đã hủy', value: 'cancelled' },
];

export default function AdminStatisticsPage() {
  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(
    () => Array.from({ length: 6 }, (_, index) => String(currentYear - index)),
    [currentYear],
  );
  const [areaTab, setAreaTab] = useState<'district' | 'ward'>('district');
  const [filters, setFilters] = useQueryStates({
    year: parseAsString.withDefault(String(currentYear)),
    month: parseAsString.withDefault(''),
    status: parseAsString.withDefault(''),
  });

  const statisticsQuery = useQuery({
    queryKey: [
      'admin',
      'statistics',
      filters.year,
      filters.month,
      filters.status,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.year) params.set('year', filters.year);
      if (filters.month) params.set('month', filters.month);
      if (filters.status) params.set('status', filters.status);
      const response = await fetch(
        `/api/admin/statistics?${params.toString()}`,
      );
      const payload = (await response.json()) as StatisticsResponse;
      if (!response.ok)
        throw new Error(
          (payload as { message?: string }).message ??
            'Không tải được thống kê',
        );
      return payload;
    },
  });

  const stats = statisticsQuery.data ?? {
    revenue: { monthly: [], total: 0 },
    ordersByArea: { byDistrict: [], byWard: [] },
    summary: { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 },
  };

  const revenueChartData = stats.revenue.monthly.map((row) => ({
    month: `T${row.month}`,
    revenue: row.total,
    orders: row.count,
  }));

  const areaRows =
    areaTab === 'district'
      ? stats.ordersByArea.byDistrict.map((row) => ({
          label: row.district,
          count: row.count,
          total: row.total,
        }))
      : stats.ordersByArea.byWard.map((row) => ({
          label: `${row.ward} (${row.district})`,
          count: row.count,
          total: row.total,
        }));

  return (
    <div className="container-shell space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Thống kê</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Doanh thu, số lượng đơn và phân bổ theo khu vực.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={filters.year}
            onValueChange={(value) => setFilters({ year: value })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((yearOption) => (
                <SelectItem key={yearOption} value={yearOption}>
                  {yearOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.month || 'all-month'}
            onValueChange={(value) =>
              setFilters({ month: value === 'all-month' ? '' : value })
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value || 'all-month'}
                  value={option.value || 'all-month'}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.status || 'all-status'}
            onValueChange={(value) =>
              setFilters({ status: value === 'all-status' ? '' : value })
            }
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value || 'all-status'}
                  value={option.value || 'all-status'}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {statisticsQuery.isError ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-foreground">
          {statisticsQuery.error.message}
        </div>
      ) : null}

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Tổng doanh thu"
          value={formatCurrency(stats.summary.totalRevenue)}
        />
        <StatCard
          title="Tổng số đơn"
          value={String(stats.summary.totalOrders)}
        />
        <StatCard
          title="Giá trị đơn trung bình"
          value={formatCurrency(stats.summary.avgOrderValue)}
        />
      </div>

      <section className="rounded-md border border-border bg-card p-4">
        <h2 className="text-xl font-semibold">Doanh thu theo tháng</h2>
        {statisticsQuery.isPending ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Đang tải dữ liệu...
          </p>
        ) : revenueChartData.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Không có dữ liệu.
          </p>
        ) : (
          <div className="mt-3 h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="revenue"
                  fill="var(--color-chart-1)"
                  name="Doanh thu"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="rounded-md border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold">Số lượng theo khu vực</h2>
          <div className="inline-flex rounded-md border p-1 text-sm">
            <Button
              type="button"
              variant={areaTab === 'district' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setAreaTab('district')}
            >
              Quận/Huyện
            </Button>
            <Button
              type="button"
              variant={areaTab === 'ward' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setAreaTab('ward')}
            >
              Phường/Xã
            </Button>
          </div>
        </div>

        {statisticsQuery.isPending ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Đang tải dữ liệu...
          </p>
        ) : areaRows.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Không có dữ liệu khu vực.
          </p>
        ) : (
          <div className="mt-3 h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaRows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="count"
                  fill="var(--color-chart-2)"
                  name="Số đơn"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {filters.status ? (
        <p className="text-sm text-muted-foreground">
          Đang lọc theo trạng thái:{' '}
          <strong>{statusLabel(filters.status)}</strong>.
        </p>
      ) : null}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card px-4 py-3">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-0 text-xl leading-snug font-bold">{value}</p>
    </div>
  );
}
