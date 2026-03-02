<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { scaleBand } from 'd3-scale';
	import { BarChart } from 'layerchart';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { formatCurrency, statusLabel } from '$lib/utils/format';

	type StatisticsResponse = {
		revenue: {
			monthly: Array<{ month: number; total: number; count: number }>;
			total: number;
		};
		ordersByArea: {
			byDistrict: Array<{ district: string; count: number; total: number }>;
			byWard: Array<{ district: string; ward: string; count: number; total: number }>;
		};
		summary: {
			totalOrders: number;
			totalRevenue: number;
			avgOrderValue: number;
		};
	};

	let { data } = $props<{
		data: {
			currentYear: number;
			yearOptions: number[];
			statusOptions: Array<{ label: string; value: string }>;
		};
	}>();

	let loading = $state(false);
	let year = $state('');
	let month = $state('');
	let status = $state('');
	let submittedYear = $state('');
	let submittedMonth = $state('');
	let submittedStatus = $state('');
	let areaTab = $state<'district' | 'ward'>('district');
	let stats = $state<StatisticsResponse>({ revenue: { monthly: [], total: 0 }, ordersByArea: { byDistrict: [], byWard: [] }, summary: { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 } });

	const monthOptions = [
		{ label: 'Cả năm', value: '' },
		...Array.from({ length: 12 }, (_, index) => ({
			label: `Tháng ${index + 1}`,
			value: String(index + 1)
		}))
	];

	const areaRows = $derived(
		areaTab === 'district'
			? stats.ordersByArea.byDistrict.map((row) => ({
					name: row.district,
					subLabel: '',
					count: row.count,
					total: row.total
				}))
			: stats.ordersByArea.byWard.map((row) => ({
					name: row.ward,
					subLabel: row.district,
					count: row.count,
					total: row.total
				}))
	);

	$effect(() => {
		if (!year) {
			year = String(data.currentYear);
			submittedYear = String(data.currentYear);
		}
	});

	const statisticsQuery = createQuery(() => ({
		queryKey: ['admin', 'statistics', submittedYear, submittedMonth, submittedStatus],
		queryFn: async () => {
			const params = new URLSearchParams();
			if (submittedYear) params.set('year', submittedYear);
			if (submittedMonth) params.set('month', submittedMonth);
			if (submittedStatus) params.set('status', submittedStatus);
			const response = await fetch(`/api/admin/statistics?${params.toString()}`);
			const payload = await response.json();
			if (!response.ok) throw new Error(payload?.message ?? 'Không tải được thống kê');
			return payload as StatisticsResponse;
		}
	}));

	$effect(() => {
		loading = statisticsQuery.isPending;
		if (statisticsQuery.data) {
			stats = statisticsQuery.data;
		}
	});

	function loadStatistics() {
		submittedYear = year;
		submittedMonth = month;
		submittedStatus = status;
	}

	const revenueChartData = $derived(
		stats.revenue.monthly.map((row) => ({ month: `T${row.month}`, revenue: row.total, orders: row.count }))
	);

	const revenueChartConfig = {
		revenue: {
			label: 'Doanh thu',
			color: 'var(--chart-1)'
		}
	} satisfies Chart.ChartConfig;

	const areaChartData = $derived(
		areaRows.map((row) => ({
			label: row.subLabel ? `${row.name} (${row.subLabel})` : row.name,
			count: row.count,
			total: row.total
		}))
	);

	const areaChartConfig = {
		count: {
			label: 'Số đơn',
			color: 'var(--chart-2)'
		}
	} satisfies Chart.ChartConfig;
</script>

<main class="container-shell space-y-5">
	<div class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="text-3xl font-bold">Thống kê</h1>
			<p class="mt-1 text-sm text-muted-foreground">Doanh thu, số lượng đơn và phân bổ theo khu vực.</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<Select.Root type="single" bind:value={year}>
				<Select.Trigger class="w-[140px]">
					{year || 'Năm'}
				</Select.Trigger>
				<Select.Content>
					{#each data.yearOptions as yearOption}
						<Select.Item value={String(yearOption)} label={String(yearOption)}>{yearOption}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<Select.Root type="single" bind:value={month}>
				<Select.Trigger class="w-[140px]">
					{monthOptions.find((option) => option.value === month)?.label ?? 'Tháng'}
				</Select.Trigger>
				<Select.Content>
					{#each monthOptions as option}
						<Select.Item value={option.value} label={option.label}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<Select.Root type="single" bind:value={status}>
				<Select.Trigger class="w-[220px]">
					{data.statusOptions.find((option: { label: string; value: string }) => option.value === status)?.label ?? 'Tất cả trạng thái'}
				</Select.Trigger>
				<Select.Content>
					{#each data.statusOptions as option}
						<Select.Item value={option.value} label={option.label}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<Button type="button" onclick={loadStatistics}>Lọc</Button>
		</div>
	</div>

	{#if statisticsQuery.isError}
		<div class="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
			{statisticsQuery.error?.message ?? 'Không tải được thống kê'}
		</div>
	{/if}

	<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
		<Card.Root><Card.Content class="px-5 py-1"><p class="text-sm text-muted-foreground">Tổng doanh thu</p><p class="mt-0 text-xl leading-tight font-bold">{formatCurrency(stats.summary.totalRevenue)}</p></Card.Content></Card.Root>
		<Card.Root><Card.Content class="px-5 py-1"><p class="text-sm text-muted-foreground">Tổng số đơn</p><p class="mt-0 text-xl leading-tight font-bold">{stats.summary.totalOrders}</p></Card.Content></Card.Root>
		<Card.Root><Card.Content class="px-5 py-1"><p class="text-sm text-muted-foreground">Giá trị đơn trung bình</p><p class="mt-0 text-xl leading-tight font-bold">{formatCurrency(stats.summary.avgOrderValue)}</p></Card.Content></Card.Root>
	</div>

	<section class="rounded-md border bg-card p-4">
		<h2 class="text-xl font-semibold">Doanh thu theo tháng</h2>
		{#if loading}
			<p class="mt-3 text-sm text-muted-foreground">Đang tải dữ liệu...</p>
		{:else if stats.revenue.monthly.length === 0}
			<p class="mt-3 text-sm text-muted-foreground">Không có dữ liệu.</p>
		{:else}
			<div class="mt-3 rounded-xl border p-3">
				<Chart.Container config={revenueChartConfig} class="min-h-[300px] w-full">
					<BarChart
						data={revenueChartData}
						xScale={scaleBand().padding(0.25)}
						x="month"
						y="revenue"
						axis="x"
						series={[{ key: 'revenue', label: 'Doanh thu', color: 'var(--color-revenue)' }]}
					>
						{#snippet tooltip()}
							<Chart.Tooltip />
						{/snippet}
					</BarChart>
				</Chart.Container>
			</div>
		{/if}
	</section>

	<section class="rounded-md border bg-card p-4">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<h2 class="text-xl font-semibold">Số lượng theo khu vực</h2>
			<Tabs.Root value={areaTab} onValueChange={(value) => (areaTab = value as 'district' | 'ward')}>
				<Tabs.List>
					<Tabs.Trigger value="district">Quận/Huyện</Tabs.Trigger>
					<Tabs.Trigger value="ward">Phường/Xã</Tabs.Trigger>
				</Tabs.List>
			</Tabs.Root>
		</div>

		{#if loading}
			<p class="mt-3 text-sm text-muted-foreground">Đang tải dữ liệu...</p>
		{:else if areaRows.length === 0}
			<p class="mt-3 text-sm text-muted-foreground">Không có dữ liệu khu vực.</p>
		{:else}
			<div class="mt-3 rounded-xl border p-3">
				<Chart.Container config={areaChartConfig} class="min-h-[320px] w-full">
					<BarChart
						data={areaChartData}
						xScale={scaleBand().padding(0.2)}
						x="label"
						y="count"
						axis="x"
						series={[{ key: 'count', label: 'Số đơn', color: 'var(--color-count)' }]}
					>
						{#snippet tooltip()}
							<Chart.Tooltip />
						{/snippet}
					</BarChart>
				</Chart.Container>
			</div>
		{/if}
	</section>

	{#if status}
		<p class="text-sm text-muted-foreground">Đang lọc theo trạng thái: <strong>{statusLabel(status)}</strong>.</p>
	{/if}
</main>
