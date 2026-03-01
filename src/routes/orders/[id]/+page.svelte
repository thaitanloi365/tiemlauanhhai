<script lang="ts">
	import { page } from '$app/state';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Header from '$lib/components/Header.svelte';
	import ReviewForm from '$lib/components/ReviewForm.svelte';
	import { sessionStore } from '$lib/stores/session';
	import { formatCurrency, statusClass, statusLabel } from '$lib/utils/format';

	let loading = $state(true);
	let errorMessage = $state('');
	let order: any = $state(null);
	let items: any[] = $state([]);
	let logs: any[] = $state([]);
	let reviewSent = $state(false);

	async function loadOrder() {
		loading = true;
		errorMessage = '';
		try {
			const sessionId = sessionStore.getCurrent();
			const res = await fetch(`/api/orders/${page.params.id}?sessionId=${sessionId}`);
			const data = await res.json();
			if (!res.ok) {
				errorMessage = data.message ?? 'Không tìm thấy đơn hàng.';
				return;
			}
			order = data.order;
			items = data.items;
			logs = data.logs;
			reviewSent = Boolean(data.review);
		} catch (error) {
			errorMessage = 'Kết nối thất bại.';
		} finally {
			loading = false;
		}
	}

	async function submitReview(rating: number, comment: string) {
		const sessionId = sessionStore.getCurrent();
		const res = await fetch('/api/reviews', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				sessionId,
				orderId: order.id,
				rating,
				comment
			})
		});
		if (!res.ok) {
			const data = await res.json();
			throw new Error(data.message ?? 'Gửi đánh giá thất bại');
		}
		reviewSent = true;
	}

	$effect(() => {
		loadOrder();
	});
</script>

<Header />
<main class="container-shell space-y-6 py-6">
	<h1 class="text-3xl font-bold">Chi tiết đơn hàng</h1>

	{#if loading}
		<p class="card-surface p-4 text-sm">Đang tải chi tiết đơn...</p>
	{:else if errorMessage}
		<p class="card-surface p-4 text-sm text-red-700">{errorMessage}</p>
	{:else}
		<section class="card-surface p-4">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<p class="text-sm text-slate-500">Mã đơn: {order.id}</p>
				<span class={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(order.status)}`}>
					{statusLabel(order.status)}
				</span>
			</div>
			<p class="mt-2 text-sm">Khách hàng: <strong>{order.customer_name}</strong> - {order.phone}</p>
			<p class="text-sm">Địa chỉ: {order.address}, {order.ward}, {order.district}, {order.province}</p>
			{#if order.tracking_id || order.tracking_url}
				<p class="mt-2 text-sm">
					Vận chuyển:
					{#if order.tracking_url}
						<a href={order.tracking_url} class="text-orange-700 underline" target="_blank" rel="noreferrer"
							>{order.tracking_id || 'Theo dõi đơn'}</a
						>
					{:else}
						{order.tracking_id}
					{/if}
				</p>
			{/if}
		</section>

		<section class="card-surface p-4">
			<h2 class="text-lg font-semibold">Món đã đặt</h2>
			<div class="mt-3 space-y-2">
				{#each items as item}
					<div class="flex items-start justify-between text-sm">
						<div>
							<p>{item.menu_variant?.menu_item?.name} - {item.menu_variant?.name}</p>
							<p class="text-slate-500">SL: {item.quantity}</p>
						</div>
						<strong>{formatCurrency(item.unit_price * item.quantity)}</strong>
					</div>
				{/each}
			</div>
			<p class="mt-3 border-t border-orange-100 pt-2 text-right font-semibold">{formatCurrency(order.total_amount)}</p>
		</section>

		<section class="card-surface p-4">
			<h2 class="text-lg font-semibold">Timeline trạng thái</h2>
			<ol class="mt-3 space-y-2 text-sm">
				{#each logs as log}
					<li class="rounded-lg bg-orange-50 p-2">
						<p class="font-medium">{statusLabel(log.status)}</p>
						<p class="text-xs text-slate-500">{new Date(log.created_at).toLocaleString('vi-VN')}</p>
					</li>
				{/each}
			</ol>
		</section>

		{#if order.status === 'delivered' && !reviewSent}
			<ReviewForm onSubmit={submitReview} />
		{:else if reviewSent}
			<p class="card-surface p-4 text-sm text-green-700">Cảm ơn bạn đã đánh giá đơn hàng.</p>
		{/if}
	{/if}
</main>

<Footer />
<BottomNav />
