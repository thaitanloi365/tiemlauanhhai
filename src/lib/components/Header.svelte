<script lang="ts">
	import CartButton from '$lib/components/CartButton.svelte';
	import { LOGO_IMAGE } from '$lib/constants/assets';
	import { cubicOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	let { onOpenCart } = $props<{ onOpenCart?: () => void }>();
</script>

<header
	class="sticky top-0 z-40 border-b border-orange-200 bg-orange-50/90 backdrop-blur"
	in:fly={{ y: -8, duration: 220, easing: cubicOut }}
>
	<div class="container-shell flex h-16 items-center justify-between gap-4">
		<a href="/" class="flex items-center gap-3">
			<img src={LOGO_IMAGE} alt="Tiệm Lẩu Anh Hai" class="size-9 rounded-md object-contain" />
			<div>
				<p class="text-sm text-orange-800">Tiệm Lẩu</p>
				<p class="text-lg font-bold leading-none">Anh Hai</p>
			</div>
		</a>
		<nav class="hidden items-center gap-6 text-sm font-medium md:flex">
			<a href="/menu" class="hover:text-orange-700">Thực đơn</a>
			<a href="/orders" class="hover:text-orange-700">Đơn hàng</a>
		</nav>
		<CartButton onOpenCart={onOpenCart} />
	</div>
</header>
