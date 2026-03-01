<script lang="ts">
	import BottomNav from '$lib/components/BottomNav.svelte';
	import Cart from '$lib/components/Cart.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import FloatingContact from '$lib/components/FloatingContact.svelte';
	import Header from '$lib/components/Header.svelte';
	import MenuFilter from '$lib/components/MenuFilter.svelte';
	import MenuItemCard from '$lib/components/MenuItem.svelte';
	import { cartStore } from '$lib/stores/cart';
	import type { MenuItem } from '$lib/types';

	let { data } = $props();
	let cartOpen = $state(false);

	function quickAdd(item: MenuItem) {
		const firstVariant = item.variants[0];
		if (!firstVariant) return;

		cartStore.add({
			variantId: firstVariant.id,
			itemId: item.id,
			itemName: item.name,
			itemSlug: item.slug,
			variantName: firstVariant.name,
			price: firstVariant.price,
			thumbnailUrl: item.thumbnail_url
		});
		cartOpen = true;
	}
</script>

<svelte:head>
	<title>Thực đơn | Tiệm Lẩu Anh Hai</title>
	<meta
		name="description"
		content="Xem thực đơn lẩu miền Tây tại Tiệm Lẩu Anh Hai."
	/>
</svelte:head>

<Header onOpenCart={() => (cartOpen = true)} />

<main>
	<section class="container-shell space-y-5 py-8">
		<div class="flex items-end justify-between gap-3">
			<div>
				<h1 class="text-3xl font-semibold md:text-4xl">Thực đơn</h1>
				<p class="text-sm text-slate-600">Lọc theo nhu cầu để chọn món nhanh hơn.</p>
			</div>
		</div>

		<MenuFilter
			selectedPrice={data.filters.price}
			selectedSort={data.filters.sort}
		/>

		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each data.menuItems as item (item.id)}
				<MenuItemCard {item} onQuickAdd={quickAdd} />
			{/each}
		</div>
	</section>
</main>

<Footer />
<FloatingContact />
<BottomNav />
<Cart open={cartOpen} onClose={() => (cartOpen = false)} />
