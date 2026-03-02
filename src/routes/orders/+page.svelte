<script lang="ts">
	import { page } from '$app/state';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Header from '$lib/components/Header.svelte';
	import OrderHistory from '$lib/components/OrderHistory.svelte';
	import { sessionStore } from '$lib/stores/session';
	import type { Order } from '$lib/types';

	let loading = $state(true);
	let orders = $state<Order[]>([]);
	let errorMessage = $state('');
	const canonicalUrl = $derived(`${page.url.origin}/orders`);

	async function loadOrders() {
		loading = true;
		errorMessage = '';
		try {
			const sessionId = sessionStore.getCurrent();
			const res = await fetch(`/api/orders?sessionId=${sessionId}`);
			const data = await res.json();
			if (!res.ok) {
				errorMessage = data.message ?? 'Không tải được đơn hàng.';
				return;
			}
			orders = data.orders;
		} catch (error) {
			errorMessage = 'Kết nối thất bại.';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadOrders();
	});
</script>

<svelte:head>
	<title>Lịch sử đơn hàng | Tiệm Lẩu Anh Hai</title>
	<meta name="description" content="Theo dõi trạng thái và lịch sử đơn hàng của bạn tại Tiệm Lẩu Anh Hai." />
	<link rel="canonical" href={canonicalUrl} />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<Header />
<main class="container-shell space-y-4 py-6">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold">Lịch sử đơn hàng</h1>
		<button class="btn-secondary" type="button" onclick={loadOrders}>Làm mới</button>
	</div>

	{#if loading}
		<p class="card-surface p-4 text-sm">Đang tải dữ liệu...</p>
	{:else if errorMessage}
		<p class="card-surface p-4 text-sm text-red-700">{errorMessage}</p>
	{:else}
		<OrderHistory {orders} />
	{/if}
</main>

<Footer />
<BottomNav />
