<script lang="ts">
	import type { MenuMedia } from '$lib/types';

	let { media } = $props<{ media: MenuMedia[] }>();
	let active = $state(0);

	const current = $derived(media[active]);
</script>

{#if media.length > 0}
	<div class="space-y-3">
		<div class="overflow-hidden rounded-2xl border border-orange-100 bg-black/5">
			{#if current.type === 'video'}
				<video class="aspect-video w-full" controls playsinline preload="metadata">
					<source src={current.url} />
				</video>
			{:else}
				<img src={current.url} alt={current.alt_text || 'Hình ảnh món ăn'} class="aspect-video w-full object-cover" />
			{/if}
		</div>
		<div class="flex gap-2 overflow-x-auto">
			{#each media as entry, idx}
				<button
					type="button"
					class={`relative overflow-hidden rounded-xl border ${idx === active ? 'border-orange-500' : 'border-orange-100'}`}
					onclick={() => (active = idx)}
				>
					{#if entry.type === 'video'}
						<div class="flex h-16 w-24 items-center justify-center bg-slate-200 text-xs font-medium">Video</div>
					{:else}
						<img src={entry.url} alt={entry.alt_text || 'thumb'} class="h-16 w-24 object-cover" />
					{/if}
				</button>
			{/each}
		</div>
	</div>
{/if}
