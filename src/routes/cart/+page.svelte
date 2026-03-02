<script lang="ts">
	import { page } from '$app/state';
	import { tick } from 'svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Header from '$lib/components/Header.svelte';
	import OrderConfirmModal from '$lib/components/OrderConfirmModal.svelte';
	import OrderForm from '$lib/components/OrderForm.svelte';
	import { HCMC_PROVINCE_NAME } from '$lib/data/provinces-old';
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
		return new Date(now.getTime() + 7 * 60 * 60 * 1000);
	}

	function toVietnamDateString(vnDate: Date) {
		const year = vnDate.getUTCFullYear();
		const month = formatDatePart(vnDate.getUTCMonth() + 1);
		const day = formatDatePart(vnDate.getUTCDate());
		return `${year}-${month}-${day}`;
	}

function parseVietnamDateString(value: string) {
	const [yearText, monthText, dayText] = value.split('-');
	const year = Number(yearText);
	const month = Number(monthText);
	const day = Number(dayText);
	if (!year || !month || !day) return null;
	return new Date(Date.UTC(year, month - 1, day));
}

	function getCutoffHour(vnDate: Date) {
		const dayOfWeek = vnDate.getUTCDay();
		return dayOfWeek === 0 || dayOfWeek === 6 ? 16 : 14;
	}

	function buildScheduleDateOptions(now: Date = new Date()): ScheduleOption[] {
		const vnNow = toVietnamClock(now);
		const startOffset = vnNow.getUTCHours() >= getCutoffHour(vnNow) ? 1 : 0;
		const options: ScheduleOption[] = [];

	function getRelativeDayLabel(offset: number) {
		if (offset === 0) return 'Hôm nay';
		if (offset === 1) return 'Ngày mai';
		if (offset === 2) return 'Ngày kia';
		return `${offset} ngày nữa`;
	}

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
			label: `${getRelativeDayLabel(offset)} (${labelDate})`
			});
		}
		return options;
	}

	function buildScheduleSlotOptions(selectedDate: string, now: Date = new Date()): TimeSlotOption[] {
		if (!selectedDate) return [...TIME_SLOTS];
		const vnNow = toVietnamClock(now);
		const todayInVietnam = toVietnamDateString(vnNow);
	if (selectedDate < todayInVietnam) return [];
	if (selectedDate > todayInVietnam) return [...TIME_SLOTS];

	const selectedVnDate = parseVietnamDateString(selectedDate);
	if (!selectedVnDate) return [];
		const cutoffHour = getCutoffHour(selectedVnDate);
	const currentMinuteOfDay = vnNow.getUTCHours() * 60 + vnNow.getUTCMinutes();

	return TIME_SLOTS.filter((slot) => {
		const slotStartMinute = slot.startHour * 60;
		return slot.endHour <= cutoffHour && slotStartMinute >= currentMinuteOfDay;
	});
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
	let invalidFields = $state<string[]>([]);
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

	$effect(() => {
		if (invalidFields.length === 0) return;
		const missingSet = new Set(getMissingFields());
		invalidFields = invalidFields.filter((field) => missingSet.has(field));
	});

	function fieldIsEmpty(value: string) {
		return value.trim().length === 0;
	}

	function getMissingFields() {
		const missing: string[] = [];
		if (fieldIsEmpty(form.customerName)) missing.push('customerName');
		if (fieldIsEmpty(form.phone)) missing.push('phone');
		if (fieldIsEmpty(form.address)) missing.push('address');
		if (fieldIsEmpty(form.district)) missing.push('district');
		if (fieldIsEmpty(form.ward)) missing.push('ward');
		if (fieldIsEmpty(form.scheduledDate)) missing.push('scheduledDate');
		if (fieldIsEmpty(form.scheduledSlot)) missing.push('scheduledSlot');
		return missing;
	}

	const focusTargetByField: Record<string, string> = {
		customerName: 'customerName',
		phone: 'phone',
		address: 'address',
		district: 'district',
		ward: 'ward',
		scheduledDate: 'scheduledDate',
		scheduledSlot: 'scheduledSlot'
	};

	async function focusFirstInvalidField(field: string) {
		await tick();
		const targetName = focusTargetByField[field];
		if (!targetName) return;
		const target = document.querySelector<HTMLElement>(`[name="${targetName}"]`);
		if (!target) return;
		target.scrollIntoView({ behavior: 'smooth', block: 'center' });
		target.focus();
	}

	async function openConfirm() {
		errorMessage = '';
		invalidFields = [];
		if ($cartStore.length === 0) {
			errorMessage = 'Giỏ hàng đang trống.';
			return;
		}

		const missingFields = getMissingFields();
		if (missingFields.length > 0) {
			invalidFields = missingFields;
			errorMessage = 'Vui lòng điền đầy đủ thông tin đặt món trước khi xác nhận.';
			await focusFirstInvalidField(missingFields[0]);
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

<main
	class={`container-shell grid gap-6 py-6 ${
		$cartStore.length > 0 ? 'lg:grid-cols-[1.1fr,0.9fr]' : ''
	}`}
>
	<section class="space-y-3">
		<h1 class="text-3xl font-bold">Giỏ hàng</h1>
		{#if $cartStore.length === 0}
			<div class="card-surface space-y-3 border border-orange-100 bg-orange-50/70 p-5">
				<p class="text-sm font-medium text-orange-700">Giỏ hàng đang trống nè</p>
				<h2 class="text-xl font-semibold text-slate-900">
					Mình chọn vài món ngon rồi đặt luôn để quán chuẩn bị nhanh cho mình nha.
				</h2>
				<p class="text-sm text-slate-600">
					Quay lại menu để thêm món, phần thông tin đặt món sẽ hiện ngay khi giỏ có sản phẩm.
				</p>
				<button class="btn-primary" type="button" onclick={() => goto('/menu')}>
					Xem menu và chọn món
				</button>
			</div>
		{:else}
			<div class="space-y-3">
				{#each $cartStore as line}
					<div class="card-surface p-3">
						<div class="flex items-start justify-between gap-4">
							<div class="min-w-0">
								<p class="font-medium">{line.itemName}</p>
								<p class="text-xs text-slate-500">{line.variantName}</p>
								<p class="text-sm text-orange-700">{formatCurrency(line.price)}</p>
							</div>
							<div class="flex shrink-0 items-center gap-4">
								<button
									class="text-sm leading-none text-red-600"
									type="button"
									onclick={() => cartStore.remove(line.variantId)}
								>
									Xóa
								</button>
								<div class="inline-flex items-center rounded-xl border border-orange-200">
									<button
										class="px-3 py-2 disabled:opacity-55"
										type="button"
										disabled={line.quantity <= 1}
										aria-disabled={line.quantity <= 1}
										onclick={() => cartStore.updateQuantity(line.variantId, line.quantity - 1)}
									>
										-
									</button>
									<span class="min-w-9 text-center">{line.quantity}</span>
									<button
										class="px-3 py-2"
										type="button"
										onclick={() => cartStore.updateQuantity(line.variantId, line.quantity + 1)}
									>
										+
									</button>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>

	{#if $cartStore.length > 0}
		<section class="card-surface p-4">
			<h2 class="text-2xl font-semibold">Thông tin đặt món</h2>
			<p class="mt-1 text-sm text-slate-600">Tổng tiền: <strong>{formatCurrency($cartTotal)}</strong></p>
			<div class="mt-4">
				<OrderForm
					model={form}
					dateOptions={scheduleDateOptions}
					slotOptions={scheduleSlotOptions}
					{submitting}
					{invalidFields}
				/>
			</div>
			{#if errorMessage}
				<p class="mt-3 text-sm text-red-700">{errorMessage}</p>
			{/if}
			<button
				class="btn-primary mt-4 w-full"
				type="button"
				onclick={openConfirm}
				disabled={submitting}
			>
				Xác nhận đặt món
			</button>
		</section>
	{/if}
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
