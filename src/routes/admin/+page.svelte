<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { formatCurrency, statusClass, statusLabel } from '$lib/utils/format';

	let stats = $state({ total: 0, pending: 0, preparing: 0, delivered: 0 });
	let orders = $state<any[]>([]);
	let visibleCount = $state(6);
	let loadMoreAnchor = $state<HTMLDivElement | null>(null);
	const CARD_PAGE_SIZE = 6;

	const visibleOrders = $derived(orders.slice(0, visibleCount));
	const hasMoreOrders = $derived(visibleCount < orders.length);

	const dashboardQuery = createQuery(() => ({
		queryKey: ['admin', 'dashboard'],
		queryFn: async () => {
		const res = await fetch('/api/admin/orders');
		const data = await res.json();
			if (!res.ok) throw new Error(data.message ?? 'Không tải được dashboard');
			return data;
		}
	}));

	function loadMoreOrders() {
		if (dashboardQuery.isPending || !hasMoreOrders) return;
		visibleCount += CARD_PAGE_SIZE;
	}

	$effect(() => {
		if (!dashboardQuery.data) return;
		stats = dashboardQuery.data.stats ?? stats;
		orders = dashboardQuery.data.orders ?? [];
		visibleCount = CARD_PAGE_SIZE;
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
			<Button variant="outline" href="/admin/orders">Quản lý đơn</Button>
			<Button variant="outline" href="/admin/menu">Quản lý menu</Button>
		</div>
	</div>

	{#if dashboardQuery.isPending}
		<div class="space-y-4">
			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{#each Array.from({ length: 4 }) as _, index (`dashboard-skeleton-${index}`)}
					<div class="rounded-md border bg-card/60 p-4 animate-pulse">
						<div class="h-3 w-20 rounded bg-orange-200/70"></div>
						<div class="mt-3 h-7 w-14 rounded bg-orange-300/70"></div>
					</div>
				{/each}
			</div>
			<section class="rounded-md border bg-card/60 p-4 animate-pulse">
				<div class="h-6 w-36 rounded bg-orange-200/70"></div>
				<div class="mt-3 space-y-2">
					{#each Array.from({ length: 5 }) as _, index (`order-skeleton-${index}`)}
						<div class="h-12 rounded-lg bg-white/80"></div>
					{/each}
				</div>
			</section>
		</div>
	{:else if dashboardQuery.isError}
		<div class="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
			{dashboardQuery.error?.message ?? 'Không tải được dashboard'}
		</div>
	{:else}
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			<Card.Root><Card.Content class="px-5 py-1"><p class="text-sm text-muted-foreground">Tổng đơn</p><p class="mt-0.5 text-2xl leading-tight font-bold">{stats.total}</p></Card.Content></Card.Root>
			<Card.Root><Card.Content class="px-5 py-1"><p class="text-sm text-muted-foreground">Chờ xác nhận</p><p class="mt-0.5 text-2xl leading-tight font-bold">{stats.pending}</p></Card.Content></Card.Root>
			<Card.Root><Card.Content class="px-5 py-1"><p class="text-sm text-muted-foreground">Đang chuẩn bị</p><p class="mt-0.5 text-2xl leading-tight font-bold">{stats.preparing}</p></Card.Content></Card.Root>
			<Card.Root><Card.Content class="px-5 py-1"><p class="text-sm text-muted-foreground">Đã giao</p><p class="mt-0.5 text-2xl leading-tight font-bold">{stats.delivered}</p></Card.Content></Card.Root>
		</div>
		<section class="rounded-md border bg-card p-4">
			<h2 class="text-xl font-semibold">Đơn gần đây</h2>
			<div class="mt-3 grid gap-3 md:grid-cols-2">
				{#each visibleOrders as order}
					<a
						href={`/admin/orders/${order.id}`}
						class="block rounded-xl border border-orange-200/80 bg-orange-50/40 p-3 text-sm transition hover:border-orange-300 hover:bg-orange-100/40"
					>
						<div class="flex items-start justify-between gap-2">
							<p class="font-semibold text-slate-900">#{order.id.slice(0, 8)}</p>
							<Badge class={statusClass(order.status)}>
								{statusLabel(order.status)}
							</Badge>
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
				<div class="mt-3 rounded-xl border border-dashed border-orange-200 bg-orange-100/35 px-4 py-8 text-center">
					<p class="text-sm font-medium text-slate-700">Chưa có đơn hàng nào.</p>
					<p class="mt-1 text-xs text-slate-500">Đơn mới sẽ hiển thị tại đây ngay khi khách đặt món.</p>
				</div>
			{/if}
		</section>
	{/if}
</main>
