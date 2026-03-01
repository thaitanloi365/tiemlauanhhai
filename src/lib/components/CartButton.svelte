<script lang="ts">
	import { cartCount } from '$lib/stores/cart';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

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

<button type="button" class="relative btn-secondary" onclick={handleClick} aria-label="Mở giỏ hàng">
	<span>Giỏ hàng</span>
	{#if $cartCount > 0}
		<span
			class="absolute -right-2 -top-2 inline-flex size-6 items-center justify-center rounded-full bg-orange-500 text-xs font-semibold text-white"
		>
			{$cartCount}
		</span>
	{/if}
</button>
