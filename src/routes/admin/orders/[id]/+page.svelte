<script lang="ts">
	import { page } from '$app/state';
	import { formatCurrency, statusLabel } from '$lib/utils/format';

	let loading = $state(true);
	let order = $state<any>(null);
	let items = $state<any[]>([]);
	let logs = $state<any[]>([]);
	let status = $state('pending');
	let trackingId = $state('');
	let trackingUrl = $state('');
	let message = $state('');

	const statusOptions = ['pending', 'confirmed', 'preparing', 'shipping', 'delivered', 'cancelled'];

	async function loadDetail() {
		loading = true;
		const res = await fetch(`/api/admin/orders/${page.params.id}`);
		const data = await res.json();
		if (res.ok) {
			order = data.order;
			items = data.items;
			logs = data.logs;
			status = order.status;
			trackingId = order.tracking_id ?? '';
			trackingUrl = order.tracking_url ?? '';
		} else {
			message = data.message ?? 'Không tải được đơn hàng';
		}
		loading = false;
	}

	async function save() {
		const res = await fetch(`/api/admin/orders/${page.params.id}`, {
			method: 'PATCH',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				status,
				trackingId: trackingId || null,
				trackingUrl: trackingUrl || null
			})
		});
		const data = await res.json();
		message = res.ok ? 'Đã cập nhật đơn hàng.' : (data.message ?? 'Không thể cập nhật');
		if (res.ok) loadDetail();
	}

	$effect(() => {
		loadDetail();
	});
</script>

<main class="container-shell space-y-4">
	<h1 class="text-3xl font-bold">Chi tiết đơn (Admin)</h1>
	{#if loading}
		<p class="card-surface p-4">Đang tải...</p>
	{:else if order}
		<section class="grid gap-4 lg:grid-cols-2">
			<div class="card-surface p-4">
				<h2 class="text-xl font-semibold">Thông tin đơn</h2>
				<p class="mt-2 text-sm">Khách: {order.customer_name}</p>
				<div class="mt-2 space-y-2">
					<div class="rounded-xl border border-sky-300 bg-sky-50 p-3">
						<p class="text-xs font-semibold uppercase tracking-wide text-sky-700">Số điện thoại</p>
						<p class="mt-1 text-sm font-semibold text-sky-900">{order.phone}</p>
					</div>
					<div class="rounded-xl border border-indigo-300 bg-indigo-50 p-3">
						<p class="text-xs font-semibold uppercase tracking-wide text-indigo-700">Địa chỉ giao hàng</p>
						<p class="mt-1 text-sm font-medium text-indigo-900">
							{order.address}, {order.ward}, {order.district}, {order.province}
						</p>
					</div>
				</div>
				{#if order.note}
					<div class="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3">
						<p class="text-xs font-semibold uppercase tracking-wide text-amber-700">Ghi chú khách hàng</p>
						<p class="mt-1 text-sm font-medium text-amber-900">{order.note}</p>
					</div>
				{/if}
				<div class="mt-4 space-y-2">
					<label class="block text-sm">
						<span class="mb-1 block">Trạng thái</span>
						<select bind:value={status} class="w-full rounded-xl border border-orange-200 px-3 py-2">
							{#each statusOptions as option}
								<option value={option}>{statusLabel(option)}</option>
							{/each}
						</select>
					</label>
					<label class="block text-sm">
						<span class="mb-1 block">Tracking ID</span>
						<input bind:value={trackingId} class="w-full rounded-xl border border-orange-200 px-3 py-2" />
					</label>
					<label class="block text-sm">
						<span class="mb-1 block">Tracking URL</span>
						<input bind:value={trackingUrl} class="w-full rounded-xl border border-orange-200 px-3 py-2" />
					</label>
				</div>
				<button class="btn-primary mt-4" type="button" onclick={save}>Lưu thay đổi</button>
				{#if message}
					<p class="mt-2 text-sm text-slate-700">{message}</p>
				{/if}
			</div>

			<div class="card-surface p-4">
				<h2 class="text-xl font-semibold">Món đã đặt</h2>
				<ul class="mt-2 space-y-2 text-sm">
					{#each items as item}
						<li class="rounded-lg bg-orange-50 p-3">
							<div class="flex items-start justify-between gap-4">
								<div>
									<p class="font-medium">
										{item.menu_variant?.menu_item?.name} - {item.menu_variant?.name}
									</p>
									<p class="text-slate-600">
										{formatCurrency(item.unit_price ?? 0)} x {item.quantity}
									</p>
								</div>
								<p class="font-semibold">{formatCurrency((item.unit_price ?? 0) * (item.quantity ?? 0))}</p>
							</div>
						</li>
					{/each}
				</ul>
				<div class="mt-3 flex items-center justify-between border-t border-orange-200 pt-3">
					<span class="font-medium">Tổng đơn</span>
					<span class="text-lg font-bold text-orange-700">{formatCurrency(order.total_amount ?? 0)}</span>
				</div>
				<h3 class="mt-4 text-lg font-semibold">Timeline trạng thái</h3>
				<ul class="mt-2 space-y-2 text-sm">
					{#each logs as log}
						<li class="rounded-lg bg-orange-50 p-2">
							{statusLabel(log.status)} - {new Date(log.created_at).toLocaleString('vi-VN')}
						</li>
					{/each}
				</ul>
			</div>
		</section>
	{:else}
		<p class="card-surface p-4 text-red-700">{message || 'Không tìm thấy đơn.'}</p>
	{/if}
</main>
