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
	let nowMs = $state(Date.now());

	const ORDER_EXPIRY_MS = 24 * 60 * 60 * 1000;

	function formatCountdown(ms: number) {
		const totalSeconds = Math.max(0, Math.floor(ms / 1000));
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;
		return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
	}

	const orderExpiry = $derived.by(() => {
		if (!order || order.status !== 'pending') return null;
		const expiresAtMs = new Date(order.created_at).getTime() + ORDER_EXPIRY_MS;
		const remainingMs = expiresAtMs - nowMs;
		const isCritical = remainingMs > 0 && remainingMs <= 60 * 60 * 1000;
		const isWarning = remainingMs > 60 * 60 * 1000 && remainingMs <= 3 * 60 * 60 * 1000;
		return {
			remainingMs,
			countdown: formatCountdown(remainingMs),
			expired: remainingMs <= 0,
			isCritical,
			isWarning
		};
	});

function formatScheduledFor(value: string | null | undefined) {
	if (!value) return null;
	const start = new Date(value);
	const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
	const dateLabel = start.toLocaleDateString('vi-VN', {
		weekday: 'long',
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		timeZone: 'Asia/Ho_Chi_Minh'
	});
	const startLabel = start.toLocaleTimeString('vi-VN', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
		timeZone: 'Asia/Ho_Chi_Minh'
	});
	const endLabel = end.toLocaleTimeString('vi-VN', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
		timeZone: 'Asia/Ho_Chi_Minh'
	});
	return `${dateLabel} (${startLabel} - ${endLabel})`;
}

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

	$effect(() => {
		const interval = window.setInterval(() => {
			nowMs = Date.now();
		}, 1000);
		return () => window.clearInterval(interval);
	});
</script>

<svelte:head>
	<title>Chi tiết đơn hàng | Tiệm Lẩu Anh Hai</title>
	<meta name="description" content="Xem chi tiết trạng thái đơn hàng tại Tiệm Lẩu Anh Hai." />
	<link rel="canonical" href={`${page.url.origin}${page.url.pathname}`} />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

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
			{#if orderExpiry}
				{#if orderExpiry.expired}
					<div class="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
						<p class="text-sm font-semibold text-red-700">🚫 Đơn đã quá 24 giờ</p>
						<p class="mt-1 text-xs text-red-700/90">Hệ thống sẽ tự động xử lý/xóa theo chính sách.</p>
					</div>
				{:else}
					<div
						class={`mt-3 rounded-xl border px-3 py-2 ${
							orderExpiry.isCritical
								? 'border-red-300 bg-red-50'
								: orderExpiry.isWarning
									? 'border-orange-300 bg-orange-50'
									: 'border-amber-200 bg-amber-50'
						}`}
					>
						<p
							class={`text-sm font-semibold ${
								orderExpiry.isCritical
									? 'text-red-700'
									: orderExpiry.isWarning
										? 'text-orange-700'
										: 'text-amber-800'
							}`}
						>
							{orderExpiry.isCritical ? '⚠️ Sắp hết hạn' : '⏳ Thời gian giữ đơn'}
						</p>
						<p
							class={`mt-1 text-lg font-bold tracking-wide ${
								orderExpiry.isCritical
									? 'animate-pulse text-red-700'
									: orderExpiry.isWarning
										? 'text-orange-700'
										: 'text-amber-800'
							}`}
						>
							{orderExpiry.countdown}
						</p>
						<p class="mt-1 text-xs text-slate-600">Đơn sẽ tự hết hạn sau khi countdown về 00:00:00.</p>
					</div>
				{/if}
			{/if}
			{#if order.scheduled_for}
				<p class="mt-2 text-sm">
					Lịch nhận món:
					<strong>{formatScheduledFor(order.scheduled_for)}</strong>
				</p>
			{/if}
		</section>

		{#if order.tracking_id || order.tracking_url || order.status === 'shipping' || order.status === 'delivered'}
			<section class="card-surface border border-orange-200 bg-orange-50/50 p-4">
				<h2 class="text-lg font-semibold">🚚 Thông tin vận chuyển</h2>
				<p class="mt-2 text-sm text-slate-700">
					Nhà hàng tạo đơn vận chuyển và ưu tiên lựa chọn mức phí tốt nhất cho bạn.
				</p>
				{#if order.tracking_url}
					<a
						href={order.tracking_url}
						class="btn-primary mt-3 inline-flex items-center gap-2"
						target="_blank"
						rel="noreferrer"
					>
						Theo dõi đơn hàng
					</a>
					<p class="mt-2 text-xs text-slate-600">
						Mã vận đơn: <strong>{order.tracking_id || 'Đang cập nhật'}</strong>
					</p>
				{:else if order.tracking_id}
					<p class="mt-3 text-sm">
						Mã vận đơn: <strong>{order.tracking_id}</strong>
					</p>
				{:else}
					<p class="mt-3 text-sm text-slate-600">Mã vận đơn đang được cập nhật.</p>
				{/if}
			</section>
		{/if}

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
