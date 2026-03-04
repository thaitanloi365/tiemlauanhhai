import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, hasSupabaseConfig } from '@/lib/server/supabase';
import { mockDb } from '@/lib/server/mock-db';
import { APP_TIMEZONE, currentYearInTz, parseInTz } from '@/lib/date';
import { resolveAdminUserFromRequest } from '@/lib/server/next-admin';

type OrderStatsRow = Pick<
  AppTypes.Order,
  'id' | 'total_amount' | 'created_at' | 'status' | 'district' | 'ward'
>;

function parseYear(value: string | null) {
  const currentYear = currentYearInTz();
  if (!value) return currentYear;
  const year = Number(value);
  return Number.isInteger(year) && year >= 2020 && year <= 2100
    ? year
    : currentYear;
}

function parseMonth(value: string | null): number | null {
  if (!value) return null;
  const month = Number(value);
  return Number.isInteger(month) && month >= 1 && month <= 12 ? month : null;
}

function getVietnamYearMonth(isoDate: string) {
  const parsed = parseInTz(isoDate, APP_TIMEZONE);
  return { year: parsed.year(), month: parsed.month() + 1 };
}

function aggregateStatistics(
  rows: OrderStatsRow[],
  filters: { year: number; month: number | null; status: string | null },
) {
  const monthlyMap = new Map<
    number,
    { month: number; total: number; count: number }
  >();
  for (let month = 1; month <= 12; month += 1) {
    monthlyMap.set(month, { month, total: 0, count: 0 });
  }

  const districtMap = new Map<
    string,
    { district: string; count: number; total: number }
  >();
  const wardMap = new Map<
    string,
    { district: string; ward: string; count: number; total: number }
  >();

  let totalRevenue = 0;
  let totalOrders = 0;

  for (const row of rows) {
    const { year, month } = getVietnamYearMonth(row.created_at);
    if (year !== filters.year) continue;
    if (filters.month && month !== filters.month) continue;
    if (filters.status && row.status !== filters.status) continue;

    totalOrders += 1;
    totalRevenue += row.total_amount ?? 0;

    const monthly = monthlyMap.get(month);
    if (monthly) {
      monthly.count += 1;
      monthly.total += row.total_amount ?? 0;
    }

    const districtKey = row.district || 'Chưa rõ quận/huyện';
    const districtEntry = districtMap.get(districtKey) ?? {
      district: districtKey,
      count: 0,
      total: 0,
    };
    districtEntry.count += 1;
    districtEntry.total += row.total_amount ?? 0;
    districtMap.set(districtKey, districtEntry);

    const wardKey = `${districtKey}::${row.ward || 'Chưa rõ phường/xã'}`;
    const wardEntry = wardMap.get(wardKey) ?? {
      district: districtKey,
      ward: row.ward || 'Chưa rõ phường/xã',
      count: 0,
      total: 0,
    };
    wardEntry.count += 1;
    wardEntry.total += row.total_amount ?? 0;
    wardMap.set(wardKey, wardEntry);
  }

  const monthly = filters.month
    ? [
        monthlyMap.get(filters.month) ?? {
          month: filters.month,
          total: 0,
          count: 0,
        },
      ]
    : Array.from(monthlyMap.values());

  return {
    revenue: {
      monthly,
      total: totalRevenue,
    },
    ordersByArea: {
      byDistrict: Array.from(districtMap.values()).sort(
        (a, b) => b.count - a.count || b.total - a.total,
      ),
      byWard: Array.from(wardMap.values()).sort(
        (a, b) => b.count - a.count || b.total - a.total,
      ),
    },
    summary: {
      totalOrders,
      totalRevenue,
      avgOrderValue:
        totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
    },
    filters,
  };
}

export async function GET(request: NextRequest) {
  const adminUser = await resolveAdminUserFromRequest(request);
  if (!adminUser)
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const year = parseYear(request.nextUrl.searchParams.get('year'));
  const month = parseMonth(request.nextUrl.searchParams.get('month'));
  const status = request.nextUrl.searchParams.get('status')?.trim() || null;
  const filters = { year, month, status };

  if (!hasSupabaseConfig()) {
    const rows = mockDb.getAllOrders().map((order) => ({
      id: order.id,
      total_amount: order.total_amount,
      created_at: order.created_at,
      status: order.status,
      district: order.district,
      ward: order.ward,
    }));
    return NextResponse.json(aggregateStatistics(rows, filters));
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('orders')
    .select('id,total_amount,created_at,status,district,ward')
    .order('created_at', { ascending: false });

  if (error)
    return NextResponse.json({ message: error.message }, { status: 500 });

  return NextResponse.json(
    aggregateStatistics((data ?? []) as OrderStatsRow[], filters),
  );
}
