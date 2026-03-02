<script lang="ts">
	import { MENU_IMAGE } from '$lib/constants/assets';
	import { formatCurrency } from '$lib/utils/format';
	import type { MenuItem } from '$lib/types';

	let { item, onQuickAdd = () => {} } = $props<{
		item: MenuItem;
		onQuickAdd?: (item: MenuItem) => void;
	}>();

	const minPrice = $derived(Math.min(...item.variants.map((v: { price: number }) => v.price)));
	const maxPrice = $derived(Math.max(...item.variants.map((v: { price: number }) => v.price)));
</script>

<article class="card-surface flex h-full flex-col overflow-hidden">
	<a href={`/menu/${item.slug}`} class="block">
		<img
			src={item.thumbnail_url || MENU_IMAGE}
			alt={item.name}
			loading="lazy"
			decoding="async"
			class="h-44 w-full object-cover"
		/>
	</a>
	<div class="flex flex-1 flex-col p-4">
		<div class="flex items-start justify-between gap-3">
			<div>
				<h3 class="text-lg font-semibold">{item.name}</h3>
				<p class="text-sm text-slate-600">{item.description ?? 'Món ngon chuẩn vị miền Tây'}</p>
			</div>
			{#if item.media.some((m: { type: string }) => m.type === 'video')}
				<span class="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">Video</span>
			{/if}
		</div>
		<div class="mt-auto space-y-3 pt-3">
			<p class="font-semibold text-orange-700">
				{#if minPrice === maxPrice}
					{formatCurrency(minPrice)}
				{:else}
					{formatCurrency(minPrice)} - {formatCurrency(maxPrice)}
				{/if}
			</p>
			<div class="flex gap-2">
				<a class="btn-secondary flex-1" href={`/menu/${item.slug}`}>Chi tiết</a>
				<button type="button" class="btn-primary flex-1" onclick={() => onQuickAdd(item)}>Thêm vào giỏ</button>
			</div>
		</div>
	</div>
</article>
