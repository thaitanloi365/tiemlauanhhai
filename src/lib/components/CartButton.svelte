<script lang="ts">
	import { cartCount } from '$lib/stores/cart';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';

	let { onOpenCart } = $props<{ onOpenCart?: () => void }>();
	let currentPath = $derived(page.url.pathname);

	function handleClick() {
		if (onOpenCart) {
			onOpenCart();
			return;
		}

		if (currentPath === '/cart') {
			window.scrollTo({ top: 0, behavior: 'smooth' });
			return;
		}

		goto('/cart');
	}
</script>

<Button type="button" variant="outline" class="relative" onclick={handleClick} aria-label="Mở giỏ hàng">
	<span>Giỏ hàng</span>
	{#if $cartCount > 0}
		<Badge class="absolute -right-2 -top-2 inline-flex size-6 items-center justify-center rounded-full p-0 text-xs font-semibold">
			{$cartCount}
		</Badge>
	{/if}
</Button>
