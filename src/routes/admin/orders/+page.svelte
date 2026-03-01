<script lang="ts">
	import { formatCurrency, statusClass, statusLabel } from '$lib/utils/format';
	import { onMount } from 'svelte';

	let orders = $state<any[]>([]);
	let status = $state('');
	let q = $state('');
	let loading = $state(true);
	const statusFilterOptions = [
		{ label: 'Tất cả trạng thái', value: '' },
		{ label: 'Chờ xác nhận', value: 'pending' },
		{ label: 'Đã xác nhận', value: 'confirmed' },
		{ label: 'Đang chuẩn bị', value: 'preparing' },
		{ label: 'Đang giao', value: 'shipping' },
		{ label: 'Đã giao', value: 'delivered' },
		{ label: 'Đã hủy', value: 'cancelled' }
	];

	async function loadOrders() {
		loading = true;
		const params = new URLSearchParams();
		if (status) params.set('status', status);
		if (q) params.set('q', q);

		const res = await fetch(`/api/admin/orders?${params.toString()}`);
		const data = await res.json();
		orders = data.orders ?? [];
		loading = false;
	}

	onMount(() => {
		loadOrders();
	});
</script>

<main class="container-shell space-y-4">
	<div class="flex flex-wrap items-end justify-between gap-3">
		<h1 class="text-3xl font-bold">Quản lý đơn hàng</h1>
		<div class="flex gap-2">
			<select class="rounded-xl border border-orange-200 px-3 py-2" bind:value={status} onchange={loadOrders}>
				{#each statusFilterOptions as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
			<input
				class="rounded-xl border border-orange-200 px-3 py-2"
				bind:value={q}
				placeholder="Tìm tên / SĐT"
				onkeydown={(event) => event.key === 'Enter' && loadOrders()}
			/>
			<button class="btn-secondary" type="button" onclick={loadOrders}>Lọc</button>
		</div>
	</div>

	{#if loading}
		<div class="card-surface animate-pulse p-4">
			<div class="mb-3 h-5 w-40 rounded bg-orange-200/70"></div>
			<div class="space-y-2">
				{#each Array.from({ length: 7 }) as _, index (`orders-row-skeleton-${index}`)}
					<div class="grid grid-cols-5 gap-2 rounded-lg bg-white/80 p-3">
						<div class="h-3 rounded bg-orange-100"></div>
						<div class="h-3 rounded bg-orange-100"></div>
						<div class="h-3 rounded bg-orange-100"></div>
						<div class="h-3 rounded bg-orange-100"></div>
						<div class="h-3 rounded bg-orange-100"></div>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="overflow-x-auto rounded-2xl border border-orange-100 bg-white">
			<table class="min-w-full text-left text-sm">
				<thead class="bg-orange-50 text-slate-700">
					<tr>
						<th class="px-4 py-3">Mã</th>
						<th class="px-4 py-3">Khách</th>
						<th class="px-4 py-3">Tổng</th>
						<th class="px-4 py-3">Trạng thái</th>
						<th class="px-4 py-3">Ngày đặt</th>
					</tr>
				</thead>
				<tbody>
					{#each orders as order}
						<tr class="border-t border-orange-100 hover:bg-orange-50/50">
							<td class="px-4 py-3">
								<a href={`/admin/orders/${order.id}`} class="text-orange-700 underline">{order.id.slice(0, 8)}</a>
							</td>
							<td class="px-4 py-3">{order.customer_name}<br />{order.phone}</td>
							<td class="px-4 py-3">{formatCurrency(order.total_amount)}</td>
							<td class="px-4 py-3">
								<span class={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(order.status)}`}>
									{statusLabel(order.status)}
								</span>
							</td>
							<td class="px-4 py-3">{new Date(order.created_at).toLocaleString('vi-VN')}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</main>
