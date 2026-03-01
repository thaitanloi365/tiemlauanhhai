<script lang="ts">
	import { cartCount } from '$lib/stores/cart';
	import { page } from '$app/state';

	let current = $derived(page.url.pathname);

	function handleCartClick(event: MouseEvent) {
		if (current !== '/cart') return;
		event.preventDefault();
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

<nav class="fixed inset-x-0 bottom-0 z-40 border-t border-orange-200 bg-white/95 md:hidden">
	<div class="mx-auto flex h-16 max-w-xl items-center justify-around">
		<a href="/" class={`text-sm font-medium ${current === '/' ? 'text-orange-600' : 'text-slate-700'}`}>Trang chủ</a>
		<a href="/menu" class={`text-sm font-medium ${current.startsWith('/menu') ? 'text-orange-600' : 'text-slate-700'}`}>Menu</a>
		<a
			href="/cart"
			class={`relative text-sm font-medium ${current === '/cart' ? 'text-orange-600' : 'text-slate-700'}`}
			onclick={handleCartClick}
		>
			Giỏ hàng
			{#if $cartCount > 0}
				<span
					class="absolute -right-5 -top-3 inline-flex size-5 items-center justify-center rounded-full bg-orange-500 text-xs text-white"
				>
					{$cartCount}
				</span>
			{/if}
		</a>
		<a href="/orders" class={`text-sm font-medium ${current.startsWith('/orders') ? 'text-orange-600' : 'text-slate-700'}`}>
			Đơn hàng
		</a>
	</div>
</nav>
