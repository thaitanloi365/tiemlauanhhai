<script lang="ts">
	import { MENU_IMAGE } from '$lib/constants/assets';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import Cart from '$lib/components/Cart.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Header from '$lib/components/Header.svelte';
	import MediaGallery from '$lib/components/MediaGallery.svelte';
	import { cartStore } from '$lib/stores/cart';
	import { formatCurrency } from '$lib/utils/format';
	import type { MenuItem, MenuVariant } from '$lib/types';

	let { data } = $props();
	let selectedVariantId = $state<string | undefined>();
	let quantity = $state(1);
	let copied = $state(false);
	let cartOpen = $state(false);
	let addonQuantities = $state<Record<string, number>>({});

	$effect(() => {
		if (!selectedVariantId) {
			selectedVariantId = data.item.variants[0]?.id;
		}
	});

	const selectedVariant = $derived(
		data.item.variants.find((variant: MenuVariant) => variant.id === selectedVariantId) ?? data.item.variants[0]
	);

	function addToCart() {
		if (!selectedVariant) return;

		cartStore.add(
			{
				variantId: selectedVariant.id,
				itemId: data.item.id,
				itemName: data.item.name,
				itemSlug: data.item.slug,
				variantName: selectedVariant.name,
				itemNote: data.item.note,
				price: selectedVariant.price,
				thumbnailUrl: data.item.thumbnail_url
			},
			quantity
		);
	}

	function getAddonQuantity(itemId: string) {
		return addonQuantities[itemId] ?? 1;
	}

	function updateAddonQuantity(itemId: string, delta: number) {
		const nextQuantity = Math.max(1, getAddonQuantity(itemId) + delta);
		addonQuantities = { ...addonQuantities, [itemId]: nextQuantity };
	}

	function addAddonToCart(item: MenuItem) {
		const firstVariant = item.variants[0];
		if (!firstVariant) return;

		cartStore.add(
			{
				variantId: firstVariant.id,
				itemId: item.id,
				itemName: item.name,
				itemSlug: item.slug,
				variantName: firstVariant.name,
				itemNote: item.note,
				price: firstVariant.price,
				thumbnailUrl: item.thumbnail_url
			},
			getAddonQuantity(item.id)
		);
		addonQuantities = { ...addonQuantities, [item.id]: 1 };
	}

	async function share() {
		const shareUrl = `${window.location.origin}/menu/${encodeURIComponent(data.item.slug)}`;
		const shareData = {
			title: data.item.name,
			url: shareUrl
		};

		if (navigator.share) {
			await navigator.share(shareData);
			return;
		}
		await navigator.clipboard.writeText(shareUrl);
		copied = true;
		setTimeout(() => (copied = false), 1800);
	}
</script>

<svelte:head>
	<title>{data.seo.title}</title>
	<meta name="description" content={data.seo.description} />
	<link rel="canonical" href={data.seo.url} />
	<meta property="og:type" content="product" />
	<meta property="og:title" content={data.seo.title} />
	<meta property="og:description" content={data.seo.description} />
	<meta property="og:image" content={data.seo.image} />
	<meta property="og:url" content={data.seo.url} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={data.seo.title} />
	<meta name="twitter:description" content={data.seo.description} />
	<meta name="twitter:image" content={data.seo.image} />
</svelte:head>

<Header onOpenCart={() => (cartOpen = true)} />
<main class="container-shell space-y-8 py-6">
	<a href="/menu" class="mb-2 inline-block text-sm text-orange-700">← Quay lại thực đơn</a>

	<section class="grid gap-6 lg:grid-cols-2">
		<MediaGallery media={data.item.media.length ? data.item.media : [{ id: 'fallback', menu_item_id: data.item.id, type: 'image', url: data.item.thumbnail_url || MENU_IMAGE, alt_text: data.item.name, sort_order: 0 }]} />
		<div class="space-y-4">
			<h1 class="text-3xl font-bold">{data.item.name}</h1>
			<p class="text-slate-700">{data.item.description ?? 'Món ngon chuẩn vị miền Tây.'}</p>
			{#if data.item.note}
				<div class="rounded-xl border border-amber-300 bg-amber-50 p-4">
					<p class="text-xs font-semibold uppercase tracking-wide text-amber-700">Lưu ý từ nhà hàng</p>
					<p class="mt-1 text-sm text-amber-900">{data.item.note}</p>
				</div>
			{/if}
			{#if data.item.preparation_time_minutes !== null}
				<div class="rounded-xl border border-orange-200 bg-orange-50/70 p-3 text-sm text-orange-900">
					Thời gian chuẩn bị dự kiến: <strong>{data.item.preparation_time_minutes} phút</strong>
				</div>
			{/if}
			{#if data.item.ingredients}
				<div class="card-surface p-4 text-sm text-slate-700">
					<p class="mb-1 font-medium">Nguyên liệu</p>
					<p>{data.item.ingredients}</p>
				</div>
			{/if}

			<div class="space-y-2">
				<p class="font-medium">Chọn phần ăn</p>
				{#each data.item.variants as variant}
					<label
						class="flex cursor-pointer items-center justify-between rounded-xl border-[0.5px] border-orange-500/70 px-3 py-2"
					>
						<div class="flex items-center gap-2">
							<input type="radio" class="peer sr-only" bind:group={selectedVariantId} value={variant.id} />
							<span
								class="flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] border-slate-300 bg-white transition peer-checked:border-orange-500 peer-focus-visible:ring-2 peer-focus-visible:ring-orange-200"
							>
								<span class="h-2 w-2 rounded-full border border-orange-500 bg-transparent opacity-0 transition peer-checked:opacity-100"></span>
							</span>
							<span>{variant.name}</span>
						</div>
						<strong>{formatCurrency(variant.price)}</strong>
					</label>
				{/each}
			</div>

			<div class="flex items-center gap-3">
				<div class="inline-flex items-center rounded-xl border border-orange-200">
					<button type="button" class="px-3 py-2" onclick={() => (quantity = Math.max(1, quantity - 1))}>-</button>
					<span class="min-w-10 text-center">{quantity}</span>
					<button type="button" class="px-3 py-2" onclick={() => (quantity += 1)}>+</button>
				</div>
				<button class="btn-primary flex-1" type="button" onclick={addToCart}>Thêm vào giỏ</button>
				<button class="btn-secondary" type="button" onclick={share}>Chia sẻ</button>
			</div>
			{#if copied}
				<p class="text-sm text-green-700">Đã copy link món ăn.</p>
			{/if}
		</div>
	</section>

	{#if data.isLauItem}
		<hr class="border-orange-200" aria-hidden="true" />
		<div class="grid gap-6 lg:grid-cols-2">
			<section class="space-y-4">
				<h2 class="text-2xl font-semibold">Gọi thêm</h2>
				<div class="space-y-3">
					{#if data.toppings.length === 0}
						<p class="card-surface p-3 text-sm text-slate-600">Hiện chưa có món gọi thêm.</p>
					{:else}
						{#each data.toppings as addon (addon.id)}
							<div class="card-surface flex flex-wrap items-center justify-between gap-3 p-3">
								<div>
									<p class="font-medium">{addon.name}</p>
									<p class="text-sm text-orange-700">{formatCurrency(addon.variants[0]?.price ?? 0)}</p>
								</div>
								<div class="flex items-center gap-2">
									<div class="inline-flex items-center rounded-xl border border-orange-200">
										<button type="button" class="px-3 py-2" onclick={() => updateAddonQuantity(addon.id, -1)}>-</button>
										<span class="min-w-9 text-center">{getAddonQuantity(addon.id)}</span>
										<button type="button" class="px-3 py-2" onclick={() => updateAddonQuantity(addon.id, 1)}>+</button>
									</div>
									<button type="button" class="btn-primary" aria-label="Thêm vào giỏ" onclick={() => addAddonToCart(addon)}>+</button>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</section>

			<section class="space-y-4">
				<h2 class="text-2xl font-semibold">Đồ uống</h2>
				<div class="space-y-3">
					{#if data.drinks.length === 0}
						<p class="card-surface p-3 text-sm text-slate-600">Hiện chưa có đồ uống.</p>
					{:else}
						{#each data.drinks as addon (addon.id)}
							<div class="card-surface flex flex-wrap items-center justify-between gap-3 p-3">
								<div>
									<p class="font-medium">{addon.name}</p>
									<p class="text-sm text-orange-700">{formatCurrency(addon.variants[0]?.price ?? 0)}</p>
								</div>
								<div class="flex items-center gap-2">
									<div class="inline-flex items-center rounded-xl border border-orange-200">
										<button type="button" class="px-3 py-2" onclick={() => updateAddonQuantity(addon.id, -1)}>-</button>
										<span class="min-w-9 text-center">{getAddonQuantity(addon.id)}</span>
										<button type="button" class="px-3 py-2" onclick={() => updateAddonQuantity(addon.id, 1)}>+</button>
									</div>
									<button type="button" class="btn-primary" aria-label="Thêm vào giỏ" onclick={() => addAddonToCart(addon)}>+</button>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</section>
		</div>
	{/if}

	<section class="space-y-3">
		<h2 class="text-2xl font-semibold">Món liên quan</h2>
		<div class="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
			{#each data.relatedItems as item}
				<a href={`/menu/${item.slug}`} class="card-surface p-3">
					<img
						src={item.thumbnail_url || MENU_IMAGE}
						alt={item.name}
						loading="lazy"
						decoding="async"
						class="h-32 w-full rounded-xl object-cover"
					/>
					<p class="mt-2 font-medium">{item.name}</p>
				</a>
			{/each}
		</div>
	</section>
</main>

<Footer />
<BottomNav />
<Cart open={cartOpen} onClose={() => (cartOpen = false)} />
