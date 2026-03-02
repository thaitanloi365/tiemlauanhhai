<script lang="ts">
	import { formatCurrency, statusClass, statusLabel } from '$lib/utils/format';
	import type { Order } from '$lib/types';
	import { Badge } from '$lib/components/ui/badge/index.js';

	let { orders } = $props<{ orders: Order[] }>();
	let nowMs = $state(Date.now());

	const ORDER_EXPIRY_MS = 24 * 60 * 60 * 1000;

	function formatCountdown(ms: number) {
		const totalSeconds = Math.max(0, Math.floor(ms / 1000));
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;
		return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
	}

	function getPendingHighlight(order: Order) {
		if (order.status !== 'pending') return null;
		const remainingMs = new Date(order.created_at).getTime() + ORDER_EXPIRY_MS - nowMs;
		const expired = remainingMs <= 0;
		const isCritical = remainingMs > 0 && remainingMs <= 60 * 60 * 1000;
		const isWarning = remainingMs > 60 * 60 * 1000 && remainingMs <= 3 * 60 * 60 * 1000;
		return {
			expired,
			isCritical,
			isWarning,
			toneClass: expired
				? 'border-red-200 bg-red-50 text-red-700'
				: isCritical
					? 'border-red-200 bg-red-50 text-red-700'
					: isWarning
						? 'border-orange-200 bg-orange-50 text-orange-700'
						: 'border-amber-200 bg-amber-50 text-amber-700',
			text: expired
				? 'Đơn đã quá hạn 24 giờ, đang chờ hệ thống xử lý.'
				: `${isCritical ? '⚠️' : '⏳'} Hết hạn sau: ${formatCountdown(remainingMs)}`
		};
	}

	$effect(() => {
		const interval = window.setInterval(() => {
			nowMs = Date.now();
		}, 1000);
		return () => window.clearInterval(interval);
	});
</script>

{#if orders.length === 0}
	<p class="rounded-xl bg-orange-50 p-4 text-sm text-slate-700">Bạn chưa có đơn hàng nào.</p>
{:else}
	<div class="grid gap-3">
		{#each orders as order}
			<a href={`/orders/${order.id}`} class="card-surface block p-4">
				<div class="flex items-start justify-between gap-2">
					<div>
						<p class="text-sm text-slate-500">Mã đơn: {order.id.slice(0, 8).toUpperCase()}</p>
						<p class="mt-1 font-semibold">{formatCurrency(order.total_amount)}</p>
						<p class="text-sm text-slate-600">{new Date(order.created_at).toLocaleString('vi-VN')}</p>
						{#if getPendingHighlight(order)}
							<p class={`mt-1 inline-block rounded-lg border px-2 py-1 text-xs font-semibold ${getPendingHighlight(order)?.toneClass}`}>
								{getPendingHighlight(order)?.text}
							</p>
						{/if}
					</div>
					<Badge class={statusClass(order.status)}>
						{statusLabel(order.status)}
					</Badge>
				</div>
			</a>
		{/each}
	</div>
{/if}
