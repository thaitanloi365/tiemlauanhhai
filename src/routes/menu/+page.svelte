<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import Cart from '$lib/components/Cart.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import FloatingContact from '$lib/components/FloatingContact.svelte';
	import Header from '$lib/components/Header.svelte';
	import MenuFilter from '$lib/components/MenuFilter.svelte';
	import MenuItemCard from '$lib/components/MenuItem.svelte';
	import type { MenuItem } from '$lib/types';

	let { data } = $props();
	let cartOpen = $state(false);
	const canonicalUrl = $derived(`${page.url.origin}/menu`);

	function quickAdd(item: MenuItem) {
		void goto(`/menu/${encodeURIComponent(item.slug)}?quickAdd=1`);
	}
</script>

<svelte:head>
	<title>Thực đơn | Tiệm Lẩu Anh Hai</title>
	<meta
		name="description"
		content="Xem thực đơn lẩu miền Tây tại Tiệm Lẩu Anh Hai."
	/>
	<link rel="canonical" href={canonicalUrl} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Thực đơn | Tiệm Lẩu Anh Hai" />
	<meta property="og:description" content="Xem thực đơn lẩu miền Tây tại Tiệm Lẩu Anh Hai." />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={`${page.url.origin}/images/menu/menu.jpeg`} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Thực đơn | Tiệm Lẩu Anh Hai" />
	<meta name="twitter:description" content="Xem thực đơn lẩu miền Tây tại Tiệm Lẩu Anh Hai." />
	<meta name="twitter:image" content={`${page.url.origin}/images/menu/menu.jpeg`} />
</svelte:head>

<Header onOpenCart={() => (cartOpen = true)} />

<main>
	<section class="container-shell space-y-3 py-5">
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

		<div class="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3">
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
