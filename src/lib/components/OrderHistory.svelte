<script lang="ts">
	import { formatCurrency, statusClass, statusLabel } from '$lib/utils/format';
	import type { Order } from '$lib/types';

	let { orders } = $props<{ orders: Order[] }>();
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
					</div>
					<span class={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(order.status)}`}>
						{statusLabel(order.status)}
					</span>
				</div>
			</a>
		{/each}
	</div>
{/if}
