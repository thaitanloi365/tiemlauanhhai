<script lang="ts">
	import { browser } from '$app/environment';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { cartStore, cartTotal } from '$lib/stores/cart';
	import { formatCurrency } from '$lib/utils/format';

	let { open = false, onClose = () => {} } = $props<{ open?: boolean; onClose?: () => void }>();
	let isDesktop = $state(false);

	function updateViewport() {
		isDesktop = window.matchMedia('(min-width: 768px)').matches;
	}

	if (browser) {
		updateViewport();
	}
</script>

<svelte:window
	onkeydown={(event) => {
		if (open && event.key === 'Escape') onClose();
	}}
	onresize={updateViewport}
/>

{#if open}
	<div
		class="fixed inset-0 z-50 bg-black/40"
		role="presentation"
		onclick={(event) => {
			if (event.target === event.currentTarget) onClose();
		}}
		transition:fade={{ duration: 180 }}
	>
		<div
			class="absolute inset-x-0 bottom-0 flex w-full max-h-[85dvh] flex-col rounded-t-2xl bg-white p-4 shadow-2xl md:inset-x-auto md:inset-y-0 md:bottom-auto md:right-0 md:h-full md:max-h-screen md:w-[420px] md:rounded-none"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			transition:fly={isDesktop
				? { x: 420, duration: 320, easing: cubicOut }
				: { y: 420, duration: 320, easing: cubicOut }}
		>
			<div class="mb-2 flex justify-center md:hidden">
				<div class="h-1.5 w-12 rounded-full bg-slate-300"></div>
			</div>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Giỏ hàng</h2>
				<button class="btn-secondary" type="button" onclick={onClose}>Đóng</button>
			</div>

			{#if $cartStore.length === 0}
				<p class="rounded-xl bg-orange-50 p-4 text-sm text-slate-700">Giỏ hàng đang trống.</p>
			{:else}
				<div class="flex-1 space-y-3 overflow-y-auto pb-5">
					{#each $cartStore as line}
						<div class="rounded-xl border border-orange-100 p-3">
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0">
									<p class="font-medium">{line.itemName}</p>
									<p class="text-xs text-slate-500">{line.variantName}</p>
									<p class="text-sm text-orange-700">{formatCurrency(line.price)}</p>
								</div>
								<div class="flex shrink-0 flex-col items-end gap-2">
									<button
										class="text-sm text-red-600"
										type="button"
										onclick={() => cartStore.remove(line.variantId)}
									>
										Xóa
									</button>
									<div class="flex items-center gap-2">
										<button
											class="size-9 rounded-lg border border-orange-200 disabled:opacity-55"
											type="button"
											disabled={line.quantity <= 1}
											aria-disabled={line.quantity <= 1}
											onclick={() => cartStore.updateQuantity(line.variantId, line.quantity - 1)}
										>
											-
										</button>
										<span class="w-8 text-center font-semibold">{line.quantity}</span>
										<button
											class="size-9 rounded-lg border border-orange-200"
											type="button"
											onclick={() => cartStore.updateQuantity(line.variantId, line.quantity + 1)}
										>
											+
										</button>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
				<div class="mt-4 space-y-2 border-t border-orange-100 pt-4">
					<p class="flex items-center justify-between text-sm">
						<span>Tạm tính</span>
						<span class="font-semibold">{formatCurrency($cartTotal)}</span>
					</p>
					<div class="flex gap-2">
						<button type="button" class="btn-secondary flex-1" onclick={() => cartStore.clear()}>Xóa tất cả</button>
						<a
							class="btn-primary flex-1"
							href="/cart"
							onclick={() => {
								onClose();
							}}
						>
							Đặt món
						</a>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
