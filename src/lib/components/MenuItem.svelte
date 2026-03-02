<script lang="ts">
	import { MENU_IMAGE } from '$lib/constants/assets';
	import { formatCurrency } from '$lib/utils/format';
	import type { MenuItem } from '$lib/types';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';

	let { item, onQuickAdd = () => {} } = $props<{
		item: MenuItem;
		onQuickAdd?: (item: MenuItem) => void;
	}>();

	const minPrice = $derived(Math.min(...item.variants.map((v: { price: number }) => v.price)));
	const maxPrice = $derived(Math.max(...item.variants.map((v: { price: number }) => v.price)));
</script>

<Card.Root class="flex h-full flex-col overflow-hidden">
	<a href={`/menu/${item.slug}`} class="block">
		<img
			src={item.thumbnail_url || MENU_IMAGE}
			alt={item.name}
			loading="lazy"
			decoding="async"
			class="h-36 w-full object-cover"
		/>
	</a>
	<div class="flex flex-1 flex-col px-3 py-2">
		<div class="flex items-start justify-between gap-3">
			<div>
				<h3 class="text-base font-semibold">{item.name}</h3>
				<p class="text-sm text-slate-600">{item.description ?? 'Món ngon chuẩn vị miền Tây'}</p>
			</div>
			{#if item.media.some((m: { type: string }) => m.type === 'video')}
				<Badge variant="secondary">Video</Badge>
			{/if}
		</div>
		<div class="mt-auto space-y-2.5 pt-4">
			<p class="font-semibold text-orange-700">
				{#if minPrice === maxPrice}
					{formatCurrency(minPrice)}
				{:else}
					{formatCurrency(minPrice)} - {formatCurrency(maxPrice)}
				{/if}
			</p>
			<div class="flex gap-2">
				<Button variant="outline" class="flex-1" href={`/menu/${item.slug}`}>Chi tiết</Button>
				<Button type="button" class="flex-1" onclick={() => onQuickAdd(item)}>Thêm vào giỏ</Button>
			</div>
		</div>
	</div>
</Card.Root>
