<script lang="ts">
	import { onMount } from 'svelte';
	import { formatCurrency, statusClass, statusLabel } from '$lib/utils/format';

	let loading = $state(true);
	let stats = $state({ total: 0, pending: 0, preparing: 0, delivered: 0 });
	let orders = $state<any[]>([]);
	let visibleCount = $state(6);
	let loadMoreAnchor = $state<HTMLDivElement | null>(null);
	const CARD_PAGE_SIZE = 6;

	const visibleOrders = $derived(orders.slice(0, visibleCount));
	const hasMoreOrders = $derived(visibleCount < orders.length);

	async function loadDashboard() {
		loading = true;
		const res = await fetch('/api/admin/orders');
		const data = await res.json();
		stats = data.stats ?? stats;
		orders = data.orders ?? [];
		visibleCount = CARD_PAGE_SIZE;
		loading = false;
	}

	function loadMoreOrders() {
		if (loading || !hasMoreOrders) return;
		visibleCount += CARD_PAGE_SIZE;
	}

	onMount(() => {
		loadDashboard();
	});

	$effect(() => {
		if (!loadMoreAnchor) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					loadMoreOrders();
				}
			},
			{ rootMargin: '180px 0px' }
		);

		observer.observe(loadMoreAnchor);
		return () => observer.disconnect();
	});
</script>

<main class="container-shell space-y-5">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold">Admin Dashboard</h1>
		<div class="flex gap-2">
			<a class="btn-secondary" href="/admin/orders">Quản lý đơn</a>
			<a class="btn-secondary" href="/admin/menu">Quản lý menu</a>
		</div>
	</div>

	{#if loading}
		<div class="space-y-4">
			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{#each Array.from({ length: 4 }) as _, index (`dashboard-skeleton-${index}`)}
					<div class="card-surface animate-pulse p-4">
						<div class="h-3 w-20 rounded bg-orange-200/70"></div>
						<div class="mt-3 h-7 w-14 rounded bg-orange-300/70"></div>
					</div>
				{/each}
			</div>
			<section class="card-surface animate-pulse p-4">
				<div class="h-6 w-36 rounded bg-orange-200/70"></div>
				<div class="mt-3 space-y-2">
					{#each Array.from({ length: 5 }) as _, index (`order-skeleton-${index}`)}
						<div class="h-12 rounded-lg bg-white/80"></div>
					{/each}
				</div>
			</section>
		</div>
	{:else}
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			<div class="card-surface p-4"><p class="text-sm text-slate-500">Tổng đơn</p><p class="text-2xl font-bold">{stats.total}</p></div>
			<div class="card-surface p-4"><p class="text-sm text-slate-500">Chờ xác nhận</p><p class="text-2xl font-bold">{stats.pending}</p></div>
			<div class="card-surface p-4"><p class="text-sm text-slate-500">Đang chuẩn bị</p><p class="text-2xl font-bold">{stats.preparing}</p></div>
			<div class="card-surface p-4"><p class="text-sm text-slate-500">Đã giao</p><p class="text-2xl font-bold">{stats.delivered}</p></div>
		</div>
		<section class="card-surface p-4">
			<h2 class="text-xl font-semibold">Đơn gần đây</h2>
			<div class="mt-3 grid gap-3 md:grid-cols-2">
				{#each visibleOrders as order}
					<a href={`/admin/orders/${order.id}`} class="block rounded-xl border border-orange-100 bg-white p-3 text-sm hover:border-orange-200 hover:bg-orange-50/30">
						<div class="flex items-start justify-between gap-2">
							<p class="font-semibold text-slate-900">#{order.id.slice(0, 8)}</p>
							<span class={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(order.status)}`}>
								{statusLabel(order.status)}
							</span>
						</div>
						<p class="mt-2 font-medium text-slate-800">{order.customer_name}</p>
						<p class="text-slate-600">{order.phone}</p>
						<div class="mt-2 flex items-center justify-between text-slate-700">
							<p class="font-medium">{formatCurrency(order.total_amount ?? 0)}</p>
							<p class="text-xs text-slate-500">{new Date(order.created_at).toLocaleString('vi-VN')}</p>
						</div>
					</a>
				{/each}
			</div>

			{#if hasMoreOrders}
				<div class="mt-3 rounded-lg border border-dashed border-orange-200 px-3 py-2 text-center text-xs text-slate-500" bind:this={loadMoreAnchor}>
					Cuộn xuống để tải thêm đơn hàng...
				</div>
			{:else if orders.length > 0}
				<p class="mt-3 text-center text-xs text-slate-500">Đã hiển thị tất cả đơn gần đây.</p>
			{:else}
				<p class="mt-3 rounded-lg bg-white px-3 py-4 text-center text-sm text-slate-500">Chưa có đơn hàng nào.</p>
			{/if}
		</section>
	{/if}
</main>
