<script lang="ts">
	import { onMount } from 'svelte';
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

	let loading = $state(true);
	let errorMessage = $state('');
	let year = $state('');
	let month = $state('');
	let status = $state('');
	let areaTab = $state<'district' | 'ward'>('district');
	let stats = $state<StatisticsResponse>({
		revenue: { monthly: [], total: 0 },
		ordersByArea: { byDistrict: [], byWard: [] },
		summary: { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 }
	});

	const monthOptions = [
		{ label: 'Cả năm', value: '' },
		...Array.from({ length: 12 }, (_, index) => ({
			label: `Tháng ${index + 1}`,
			value: String(index + 1)
		}))
	];

	const maxMonthlyRevenue = $derived(
		Math.max(0, ...stats.revenue.monthly.map((row) => row.total))
	);
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
		}
	});

	async function loadStatistics() {
		loading = true;
		errorMessage = '';
		try {
			const params = new URLSearchParams();
			if (year) params.set('year', year);
			if (month) params.set('month', month);
			if (status) params.set('status', status);
			const response = await fetch(`/api/admin/statistics?${params.toString()}`);
			const payload = await response.json();
			if (!response.ok) throw new Error(payload?.message ?? 'Không tải được thống kê');
			stats = payload;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Không tải được thống kê';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadStatistics();
	});
</script>

<main class="container-shell space-y-5">
	<div class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="text-3xl font-bold">Thống kê</h1>
			<p class="mt-1 text-sm text-slate-600">Doanh thu, số lượng đơn và phân bổ theo khu vực.</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<select class="rounded-xl border border-orange-200 px-3 py-2 text-sm" bind:value={year}>
				{#each data.yearOptions as yearOption}
					<option value={String(yearOption)}>{yearOption}</option>
				{/each}
			</select>
			<select class="rounded-xl border border-orange-200 px-3 py-2 text-sm" bind:value={month}>
				{#each monthOptions as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
			<select class="rounded-xl border border-orange-200 px-3 py-2 text-sm" bind:value={status}>
				{#each data.statusOptions as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
			<button class="btn-secondary" type="button" onclick={loadStatistics}>Lọc</button>
		</div>
	</div>

	{#if errorMessage}
		<div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
	{/if}

	<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
		<div class="card-surface p-4">
			<p class="text-sm text-slate-500">Tổng doanh thu</p>
			<p class="mt-1 text-2xl font-bold">{formatCurrency(stats.summary.totalRevenue)}</p>
		</div>
		<div class="card-surface p-4">
			<p class="text-sm text-slate-500">Tổng số đơn</p>
			<p class="mt-1 text-2xl font-bold">{stats.summary.totalOrders}</p>
		</div>
		<div class="card-surface p-4">
			<p class="text-sm text-slate-500">Giá trị đơn trung bình</p>
			<p class="mt-1 text-2xl font-bold">{formatCurrency(stats.summary.avgOrderValue)}</p>
		</div>
	</div>

	<section class="card-surface p-4">
		<h2 class="text-xl font-semibold">Doanh thu theo tháng</h2>
		{#if loading}
			<p class="mt-3 text-sm text-slate-500">Đang tải dữ liệu...</p>
		{:else if stats.revenue.monthly.length === 0}
			<p class="mt-3 text-sm text-slate-500">Không có dữ liệu.</p>
		{:else}
			<div class="mt-3 overflow-x-auto rounded-xl border border-orange-100">
				<table class="min-w-full text-left text-sm">
					<thead class="bg-orange-50 text-slate-700">
						<tr>
							<th class="px-4 py-3">Tháng</th>
							<th class="px-4 py-3">Số đơn</th>
							<th class="px-4 py-3">Doanh thu</th>
							<th class="px-4 py-3">Biểu đồ</th>
						</tr>
					</thead>
					<tbody>
						{#each stats.revenue.monthly as row}
							<tr class="border-t border-orange-100">
								<td class="px-4 py-3 font-medium">Tháng {row.month}</td>
								<td class="px-4 py-3">{row.count}</td>
								<td class="px-4 py-3">{formatCurrency(row.total)}</td>
								<td class="px-4 py-3">
									<div class="h-2 w-full rounded-full bg-orange-100">
										<div
											class="h-2 rounded-full bg-orange-500"
											style={`width: ${maxMonthlyRevenue > 0 ? (row.total / maxMonthlyRevenue) * 100 : 0}%`}
										></div>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	<section class="card-surface p-4">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<h2 class="text-xl font-semibold">Số lượng theo khu vực</h2>
			<div class="flex gap-2 rounded-xl bg-orange-50 p-1 text-sm">
				<button
					type="button"
					class={`rounded-lg px-3 py-1.5 ${areaTab === 'district' ? 'bg-orange-500 text-white' : 'text-slate-600'}`}
					onclick={() => (areaTab = 'district')}
				>
					Quận/Huyện
				</button>
				<button
					type="button"
					class={`rounded-lg px-3 py-1.5 ${areaTab === 'ward' ? 'bg-orange-500 text-white' : 'text-slate-600'}`}
					onclick={() => (areaTab = 'ward')}
				>
					Phường/Xã
				</button>
			</div>
		</div>

		{#if loading}
			<p class="mt-3 text-sm text-slate-500">Đang tải dữ liệu...</p>
		{:else if areaRows.length === 0}
			<p class="mt-3 text-sm text-slate-500">Không có dữ liệu khu vực.</p>
		{:else}
			<div class="mt-3 overflow-x-auto rounded-xl border border-orange-100">
				<table class="min-w-full text-left text-sm">
					<thead class="bg-orange-50 text-slate-700">
						<tr>
							<th class="px-4 py-3">Khu vực</th>
							<th class="px-4 py-3">Số đơn</th>
							<th class="px-4 py-3">Doanh thu</th>
						</tr>
					</thead>
					<tbody>
						{#each areaRows as row}
							<tr class="border-t border-orange-100">
								<td class="px-4 py-3 font-medium">
									{#if row.subLabel}
										<div>
											<p>{row.name}</p>
											<p class="text-xs text-slate-500">{row.subLabel}</p>
										</div>
									{:else}
										{row.name}
									{/if}
								</td>
								<td class="px-4 py-3">{row.count}</td>
								<td class="px-4 py-3">{formatCurrency(row.total)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	{#if status}
		<p class="text-sm text-slate-500">Đang lọc theo trạng thái: <strong>{statusLabel(status)}</strong>.</p>
	{/if}
</main>
