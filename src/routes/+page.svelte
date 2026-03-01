<script lang="ts">
	import BottomNav from '$lib/components/BottomNav.svelte';
	import Cart from '$lib/components/Cart.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import FloatingContact from '$lib/components/FloatingContact.svelte';
	import Header from '$lib/components/Header.svelte';
	import MenuBook from '$lib/components/MenuBook.svelte';

	let { data } = $props();
	let cartOpen = $state(false);
</script>

<svelte:head>
	<title>Tiệm Lẩu Anh Hai | Hương vị miền Tây</title>
	<meta
		name="description"
		content="Đặt lẩu online Tiệm Lẩu Anh Hai. Menu lẩu miền Tây, topping phong phú, giao hàng nhanh."
	/>
</svelte:head>

<Header onOpenCart={() => (cartOpen = true)} />

<main>
	<section class="container-shell py-8">
		<div class="card-surface overflow-hidden md:grid md:grid-cols-8">
			<div class="space-y-4 p-6 md:col-span-3">
				<p class="inline-flex rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-800">
					Hương vị miền Tây Nam Bộ
				</p>
				<h1 class="text-4xl font-bold leading-tight md:text-5xl">Tiệm Lẩu Anh Hai</h1>
				<p class="text-slate-700">
					Đặt lẩu nóng hổi tại nhà với phong vị miền quê. Phù hợp nhóm nhỏ, gia đình và bữa tụ họp cuối tuần.
				</p>
				<div class="flex gap-3">
					<a href="/menu" class="btn-primary">Xem thực đơn</a>
					<a href="/orders" class="btn-secondary">Lịch sử đơn</a>
				</div>
				{#if data.source === 'sample'}
					<p class="text-xs text-slate-500">
						Đang dùng dữ liệu mẫu. Cập nhật `.env` để kết nối Supabase production.
					</p>
				{/if}
			</div>
			<div class="p-3 md:col-span-5 md:h-auto md:p-4">
				<MenuBook />
			</div>
		</div>
	</section>
</main>

<Footer />
<FloatingContact />
<BottomNav />
<Cart open={cartOpen} onClose={() => (cartOpen = false)} />
