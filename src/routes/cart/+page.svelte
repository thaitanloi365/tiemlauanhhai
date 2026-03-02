<script lang="ts">
	import { page } from '$app/state';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Header from '$lib/components/Header.svelte';
	import OrderConfirmModal from '$lib/components/OrderConfirmModal.svelte';
	import OrderForm from '$lib/components/OrderForm.svelte';
	import { HCMC_PROVINCE_NAME } from '$lib/data/provinces';
	import { cartStore, cartTotal } from '$lib/stores/cart';
	import { sessionStore } from '$lib/stores/session';
	import { formatCurrency } from '$lib/utils/format';
	import { goto } from '$app/navigation';

	type ScheduleOption = { value: string; label: string };
	type TimeSlotOption = { value: string; label: string; startHour: number; endHour: number };

	const TIME_SLOTS: TimeSlotOption[] = [
		{ value: '10:00-12:00', label: '10:00 - 12:00', startHour: 10, endHour: 12 },
		{ value: '12:00-14:00', label: '12:00 - 14:00', startHour: 12, endHour: 14 },
		{ value: '14:00-16:00', label: '14:00 - 16:00', startHour: 14, endHour: 16 },
		{ value: '16:00-18:00', label: '16:00 - 18:00', startHour: 16, endHour: 18 },
		{ value: '18:00-20:00', label: '18:00 - 20:00', startHour: 18, endHour: 20 }
	];

	function formatDatePart(value: number) {
		return String(value).padStart(2, '0');
	}

	function toVietnamClock(now: Date) {
		return new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60 * 1000);
	}

	function toVietnamDateString(vnDate: Date) {
		const year = vnDate.getUTCFullYear();
		const month = formatDatePart(vnDate.getUTCMonth() + 1);
		const day = formatDatePart(vnDate.getUTCDate());
		return `${year}-${month}-${day}`;
	}

	function getCutoffHour(vnDate: Date) {
		const dayOfWeek = vnDate.getUTCDay();
		return dayOfWeek === 0 || dayOfWeek === 6 ? 16 : 14;
	}

	function fromVietnamDateString(value: string) {
		return new Date(`${value}T00:00:00+07:00`);
	}

	function buildScheduleDateOptions(now: Date = new Date()): ScheduleOption[] {
		const vnNow = toVietnamClock(now);
		const startOffset = vnNow.getUTCHours() >= getCutoffHour(vnNow) ? 1 : 0;
		const options: ScheduleOption[] = [];
		for (let offset = startOffset; offset <= 7; offset += 1) {
			const vnDay = new Date(
				Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate() + offset)
			);
			const dateValue = toVietnamDateString(vnDay);
			const dateForLabel = new Date(`${dateValue}T00:00:00+07:00`);
			const labelDate = new Intl.DateTimeFormat('vi-VN', {
				weekday: 'long',
				day: '2-digit',
				month: '2-digit',
				timeZone: 'Asia/Ho_Chi_Minh'
			}).format(dateForLabel);
			options.push({
				value: dateValue,
				label: offset === 0 ? `Hôm nay (${labelDate})` : labelDate
			});
		}
		return options;
	}

	function buildScheduleSlotOptions(selectedDate: string, now: Date = new Date()): TimeSlotOption[] {
		if (!selectedDate) return [...TIME_SLOTS];
		const vnNow = toVietnamClock(now);
		const todayInVietnam = toVietnamDateString(vnNow);
		if (selectedDate !== todayInVietnam) return [...TIME_SLOTS];

		const selectedVnDate = fromVietnamDateString(selectedDate);
		const cutoffHour = getCutoffHour(selectedVnDate);
		const currentHour = vnNow.getUTCHours();

		return TIME_SLOTS.filter((slot) => slot.endHour <= cutoffHour && slot.endHour > currentHour);
	}

	const scheduleDateOptions = buildScheduleDateOptions();

	let form = $state({
		customerName: '',
		phone: '',
		website: '',
		province: '',
		district: '',
		ward: '',
		address: '',
		note: '',
		scheduledDate: scheduleDateOptions[0]?.value ?? '',
		scheduledSlot: TIME_SLOTS[0]?.value ?? ''
	});
	let scheduleSlotOptions = $derived(buildScheduleSlotOptions(form.scheduledDate));

	let submitting = $state(false);
	let showConfirm = $state(false);
	let errorMessage = $state('');
	const canonicalUrl = $derived(`${page.url.origin}/cart`);
	const selectedScheduleOption = $derived(
		scheduleDateOptions.find((option) => option.value === form.scheduledDate) ?? null
	);
	const selectedSlotOption = $derived(
		scheduleSlotOptions.find((option) => option.value === form.scheduledSlot) ?? null
	);

	$effect(() => {
		const hasSelectedDate = scheduleDateOptions.some((option) => option.value === form.scheduledDate);
		if (!hasSelectedDate) {
			form.scheduledDate = scheduleDateOptions[0]?.value ?? '';
		}
	});

	$effect(() => {
		const hasSelectedSlot = scheduleSlotOptions.some((option) => option.value === form.scheduledSlot);
		if (!hasSelectedSlot) {
			form.scheduledSlot = scheduleSlotOptions[0]?.value ?? '';
		}
	});

	function openConfirm() {
		errorMessage = '';
		if ($cartStore.length === 0) {
			errorMessage = 'Giỏ hàng đang trống.';
			return;
		}
		if (!form.customerName || !form.phone || !form.address || !form.district || !form.ward) {
			errorMessage = 'Vui lòng điền đầy đủ thông tin đặt món trước khi xác nhận.';
			return;
		}
		if (!form.scheduledDate || !form.scheduledSlot) {
			errorMessage = 'Vui lòng chọn ngày và khung giờ nhận món.';
			return;
		}
		if (form.province !== HCMC_PROVINCE_NAME) {
			errorMessage = 'Hiện tại quán chỉ hỗ trợ giao khu vực Thành phố Hồ Chí Minh.';
			return;
		}
		showConfirm = true;
	}

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
					phone: form.phone.replace(/\s+/g, ''),
					website: form.website,
					province: form.province,
					district: form.district,
					ward: form.ward,
					address: form.address,
					note: form.note,
					scheduledDate: form.scheduledDate,
					scheduledSlot: form.scheduledSlot,
					items: $cartStore.map((line) => ({ variantId: line.variantId, quantity: line.quantity }))
				})
			});

			const data = await res.json();
			if (!res.ok) {
				errorMessage = data.message ?? 'Không thể tạo đơn hàng.';
				showConfirm = false;
				return;
			}

			cartStore.clear();
			await goto(`/orders/${data.orderId}`);
		} catch (error) {
			errorMessage = 'Kết nối thất bại, vui lòng thử lại.';
			showConfirm = false;
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Giỏ hàng | Tiệm Lẩu Anh Hai</title>
	<meta
		name="description"
		content="Xem lại món đã chọn, cập nhật số lượng và hoàn tất đặt hàng tại Tiệm Lẩu Anh Hai."
	/>
	<link rel="canonical" href={canonicalUrl} />
	<meta name="robots" content="noindex, nofollow" />
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
			<OrderForm model={form} dateOptions={scheduleDateOptions} slotOptions={scheduleSlotOptions} {submitting} />
		</div>
		{#if errorMessage}
			<p class="mt-3 text-sm text-red-700">{errorMessage}</p>
		{/if}
		<button class="btn-primary mt-4 w-full" type="button" onclick={openConfirm} disabled={submitting}>
			Xác nhận đặt món
		</button>
	</section>
</main>

{#if showConfirm}
	<OrderConfirmModal
		form={form}
		lines={$cartStore}
		totalAmount={$cartTotal}
		scheduledDateLabel={selectedScheduleOption?.label ?? form.scheduledDate}
		scheduledSlotLabel={selectedSlotOption?.label ?? form.scheduledSlot}
		{submitting}
		onCancel={() => (showConfirm = false)}
		onConfirm={submitOrder}
	/>
{/if}

<Footer />
<BottomNav />
