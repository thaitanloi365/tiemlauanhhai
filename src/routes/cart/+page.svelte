<script lang="ts">
	import BottomNav from '$lib/components/BottomNav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Header from '$lib/components/Header.svelte';
	import OrderForm from '$lib/components/OrderForm.svelte';
	import { cartStore, cartTotal } from '$lib/stores/cart';
	import { sessionStore } from '$lib/stores/session';
	import { formatCurrency } from '$lib/utils/format';
	import { goto } from '$app/navigation';

	let form = $state({
		customerName: '',
		phone: '',
		province: '',
		district: '',
		ward: '',
		address: '',
		note: ''
	});

	let submitting = $state(false);
	let errorMessage = $state('');

	async function submitOrder() {
		errorMessage = '';
		if ($cartStore.length === 0) {
			errorMessage = 'Giỏ hàng đang trống.';
			return;
		}

		submitting = true;
		try {
			const res = await fetch('/api/orders', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					sessionId: sessionStore.getCurrent(),
					customerName: form.customerName,
					phone: form.phone,
					province: form.province,
					district: form.district,
					ward: form.ward,
					address: form.address,
					note: form.note,
					items: $cartStore.map((line) => ({ variantId: line.variantId, quantity: line.quantity }))
				})
			});

			const data = await res.json();
			if (!res.ok) {
				errorMessage = data.message ?? 'Không thể tạo đơn hàng.';
				return;
			}

			cartStore.clear();
			await goto(`/orders/${data.orderId}`);
		} catch (error) {
			errorMessage = 'Kết nối thất bại, vui lòng thử lại.';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Giỏ hàng | Tiệm Lẩu Anh Hai</title>
</svelte:head>

<Header />

<main class="container-shell grid gap-6 py-6 lg:grid-cols-[1.1fr,0.9fr]">
	<section class="space-y-3">
		<h1 class="text-3xl font-bold">Giỏ hàng</h1>
		{#if $cartStore.length === 0}
			<p class="card-surface p-4 text-sm">
				Chưa có món nào trong giỏ.
				<button
					type="button"
					class="ml-1 font-medium text-orange-700 underline decoration-orange-300 underline-offset-2"
					onclick={() => goto('/menu')}
				>
					Xem menu
				</button>.
			</p>
		{:else}
			<div class="space-y-3">
				{#each $cartStore as line}
					<div class="card-surface p-3">
						<div class="flex items-start justify-between gap-3">
							<div>
								<p class="font-medium">{line.itemName}</p>
								<p class="text-xs text-slate-500">{line.variantName}</p>
								<p class="text-sm text-orange-700">{formatCurrency(line.price)}</p>
							</div>
							<div class="inline-flex items-center rounded-xl border border-orange-200">
								<button class="px-3 py-2" type="button" onclick={() => cartStore.updateQuantity(line.variantId, line.quantity - 1)}>-</button>
								<span class="min-w-9 text-center">{line.quantity}</span>
								<button class="px-3 py-2" type="button" onclick={() => cartStore.updateQuantity(line.variantId, line.quantity + 1)}>+</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<section class="card-surface p-4">
		<h2 class="text-2xl font-semibold">Thông tin đặt món</h2>
		<p class="mt-1 text-sm text-slate-600">Tổng tiền: <strong>{formatCurrency($cartTotal)}</strong></p>
		<div class="mt-4">
			<OrderForm model={form} {submitting} />
		</div>
		{#if errorMessage}
			<p class="mt-3 text-sm text-red-700">{errorMessage}</p>
		{/if}
		<button class="btn-primary mt-4 w-full" type="button" onclick={submitOrder} disabled={submitting}>
			{submitting ? 'Đang xử lý...' : 'Xác nhận đặt món'}
		</button>
	</section>
</main>

<Footer />
<BottomNav />
