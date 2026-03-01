<script lang="ts">
	let loading = $state(true);
	let stats = $state({ total: 0, pending: 0, preparing: 0, delivered: 0 });
	let orders = $state<any[]>([]);

	async function loadDashboard() {
		loading = true;
		const res = await fetch('/api/admin/orders');
		const data = await res.json();
		stats = data.stats ?? stats;
		orders = (data.orders ?? []).slice(0, 8);
		loading = false;
	}

	$effect(() => {
		loadDashboard();
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
		<p class="card-surface p-4">Đang tải...</p>
	{:else}
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			<div class="card-surface p-4"><p class="text-sm text-slate-500">Tổng đơn</p><p class="text-2xl font-bold">{stats.total}</p></div>
			<div class="card-surface p-4"><p class="text-sm text-slate-500">Chờ xác nhận</p><p class="text-2xl font-bold">{stats.pending}</p></div>
			<div class="card-surface p-4"><p class="text-sm text-slate-500">Đang chuẩn bị</p><p class="text-2xl font-bold">{stats.preparing}</p></div>
			<div class="card-surface p-4"><p class="text-sm text-slate-500">Đã giao</p><p class="text-2xl font-bold">{stats.delivered}</p></div>
		</div>
		<section class="card-surface p-4">
			<h2 class="text-xl font-semibold">Đơn gần đây</h2>
			<div class="mt-3 space-y-2">
				{#each orders as order}
					<a href={`/admin/orders/${order.id}`} class="block rounded-lg bg-white p-3 text-sm">
						#{order.id.slice(0, 8)} - {order.customer_name} - {order.status}
					</a>
				{/each}
			</div>
		</section>
	{/if}
</main>
