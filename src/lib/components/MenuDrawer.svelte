<script lang="ts">
	import { browser } from '$app/environment';
	import { cubicOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';
	import { cartStore } from '$lib/stores/cart';
	import { formatCurrency } from '$lib/utils/format';
	import type { Category, MenuItem } from '$lib/types';

	let { open = false, onClose = () => {} } = $props<{ open?: boolean; onClose?: () => void }>();

	let isDesktop = $state(false);
	let loading = $state(false);
	let loaded = $state(false);
	let errorMessage = $state('');
	let categories = $state<Category[]>([]);
	let menuItems = $state<MenuItem[]>([]);

	function updateViewport() {
		isDesktop = window.matchMedia('(min-width: 768px)').matches;
	}

	if (browser) {
		updateViewport();
	}

	async function loadMenu() {
		if (loading || loaded) return;
		loading = true;
		errorMessage = '';
		try {
			const res = await fetch('/api/menu');
			const data = await res.json();
			if (!res.ok) {
				errorMessage = data?.message ?? 'Không thể tải thực đơn.';
				return;
			}
			categories = data.categories ?? [];
			menuItems = data.menuItems ?? [];
			loaded = true;
		} catch {
			errorMessage = 'Không thể tải thực đơn.';
		} finally {
			loading = false;
		}
	}

	function quickAdd(item: MenuItem) {
		const firstVariant = item.variants[0];
		if (!firstVariant) return;
		cartStore.add({
			variantId: firstVariant.id,
			itemId: item.id,
			itemName: item.name,
			itemSlug: item.slug,
			variantName: firstVariant.name,
			itemNote: item.note,
			price: firstVariant.price,
			thumbnailUrl: item.thumbnail_url
		});
	}

	$effect(() => {
		if (open) {
			void loadMenu();
		}
	});

	const categoryNameById = $derived(new Map(categories.map((category) => [category.id, category.name])));
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
			class="absolute inset-x-0 bottom-0 flex max-h-[85vh] w-full flex-col rounded-t-2xl bg-background p-4 shadow-2xl md:inset-x-auto md:inset-y-0 md:bottom-auto md:right-0 md:max-h-none md:max-w-2xl md:rounded-none"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			transition:fly={isDesktop
				? { x: 360, duration: 320, easing: cubicOut }
				: { y: 320, duration: 320, easing: cubicOut }}
		>
			<div class="mb-2 flex justify-center md:hidden">
				<div class="h-1.5 w-12 rounded-full bg-slate-300"></div>
			</div>
			<div class="mb-3 flex items-center justify-between gap-3 border-b border-orange-100 pb-3">
				<div>
					<h2 class="text-lg font-semibold">Thực đơn</h2>
					<p class="text-xs text-slate-500">Chạm thêm món để cập nhật giỏ hàng ngay.</p>
				</div>
				<button class="btn-secondary" type="button" onclick={onClose}>Đóng</button>
			</div>

			{#if loading}
				<p class="rounded-xl bg-orange-50 p-4 text-sm text-slate-700">Đang tải thực đơn...</p>
			{:else if errorMessage}
				<p class="rounded-xl bg-red-50 p-4 text-sm text-red-700">{errorMessage}</p>
			{:else}
				<div class="mb-3 flex gap-2 overflow-x-auto pb-1">
					{#each categories as category}
						<span class="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs text-orange-800">
							{category.name}
						</span>
					{/each}
				</div>
				<div class="grid flex-1 gap-3 overflow-y-auto pb-4 md:grid-cols-2">
					{#each menuItems as item (item.id)}
						<div class="rounded-xl border border-orange-100 p-3">
							<div class="mb-2 flex items-start justify-between gap-3">
								<div>
									<p class="font-medium">{item.name}</p>
									<p class="text-xs text-slate-500">{categoryNameById.get(item.category_id) ?? 'Món ăn'}</p>
								</div>
								<p class="text-sm font-semibold text-orange-700">
									{formatCurrency(Math.min(...item.variants.map((variant) => variant.price)))}
								</p>
							</div>
							<button type="button" class="btn-primary w-full text-sm" onclick={() => quickAdd(item)}>
								Thêm vào giỏ
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}
