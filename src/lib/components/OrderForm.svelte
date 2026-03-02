<script lang="ts">
	import { HCM_DISTRICTS_NEW } from '$lib/data/hcm-districts-new';
	import { HCM_DISTRICTS_OLD } from '$lib/data/hcm-districts-old';
	import { HCM_WARDS_NEW } from '$lib/data/hcm-wards-new';
	import { HCM_WARDS_OLD } from '$lib/data/hcm-wards-old';
	import { PROVINCES_NEW } from '$lib/data/provinces-new';
	import { HCMC_PROVINCE_CODE, HCMC_PROVINCE_NAME, PROVINCES_OLD } from '$lib/data/provinces-old';

	type AddressMode = 'old' | 'new';

	let {
		model,
		dateOptions = [],
		slotOptions = [],
		submitting = false,
		invalidFields = []
	} = $props<{
		model: {
			customerName: string;
			phone: string;
			website: string;
			province: string;
			district: string;
			ward: string;
			address: string;
			note: string;
			scheduledDate: string;
			scheduledSlot: string;
		};
		dateOptions?: { value: string; label: string }[];
		slotOptions?: { value: string; label: string }[];
		submitting?: boolean;
		invalidFields?: string[];
	}>();

	function isInvalid(field: string) {
		return invalidFields.includes(field);
	}

	const hcmProvinceName = HCMC_PROVINCE_NAME;
	let selectedProvinceCode = $state(HCMC_PROVINCE_CODE);
	let addressMode = $state<AddressMode>('old');
	let previousProvinceCode = HCMC_PROVINCE_CODE;
	let previousDistrict = '';
	let previousAddressMode: AddressMode = 'old';
	let notifyWhenSupported = $state<'yes' | 'no'>('no');
	let subscriberEmail = $state('');
	let subscriberSubmitting = $state(false);
	let subscriberMessage = $state('');
	let subscriberError = $state('');
	let phoneDisplayValue = $state('');

	const provinceOptions = $derived(addressMode === 'old' ? PROVINCES_OLD : PROVINCES_NEW);
	const provinceByCode = $derived(new Map(provinceOptions.map((province) => [province.code, province.name])));

	$effect(() => {
		if (!model.province && selectedProvinceCode === HCMC_PROVINCE_CODE) {
			model.province = hcmProvinceName;
		}
		if (!provinceByCode.has(selectedProvinceCode)) {
			selectedProvinceCode = HCMC_PROVINCE_CODE;
		}
		model.province = provinceByCode.get(selectedProvinceCode) ?? '';
	});

	const isHcmProvince = $derived(selectedProvinceCode === HCMC_PROVINCE_CODE);
	const districtOptions = $derived(addressMode === 'old' ? HCM_DISTRICTS_OLD : HCM_DISTRICTS_NEW);
	const wardOptions = $derived(
		(addressMode === 'old' ? HCM_WARDS_OLD : HCM_WARDS_NEW)[model.district] ?? []
	);

	$effect(() => {
		if (previousProvinceCode !== selectedProvinceCode) {
			previousProvinceCode = selectedProvinceCode;
			model.district = '';
			model.ward = '';
			subscriberMessage = '';
			subscriberError = '';
			notifyWhenSupported = 'no';
		}
	});

	$effect(() => {
		if (previousAddressMode !== addressMode) {
			previousAddressMode = addressMode;
			selectedProvinceCode = HCMC_PROVINCE_CODE;
			model.district = '';
			model.ward = '';
		}
	});

	$effect(() => {
		if (previousDistrict !== model.district) {
			previousDistrict = model.district;
			model.ward = '';
		}
	});

	function normalizeVietnamPhoneInput(value: string) {
		const digitsOnly = value.replace(/\D/g, '');
		if (!digitsOnly) return '';
		if (digitsOnly.startsWith('84')) return `0${digitsOnly.slice(2, 11)}`;
		if (digitsOnly.startsWith('0')) return digitsOnly.slice(0, 10);
		return digitsOnly.slice(0, 10);
	}

	function formatVietnamPhone(value: string) {
		const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
		if (digitsOnly.length <= 4) return digitsOnly;
		if (digitsOnly.length <= 7) return `${digitsOnly.slice(0, 4)} ${digitsOnly.slice(4)}`;
		return `${digitsOnly.slice(0, 4)} ${digitsOnly.slice(4, 7)} ${digitsOnly.slice(7)}`;
	}

	function onPhoneInput(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		const normalized = normalizeVietnamPhoneInput(target.value);
		const formatted = formatVietnamPhone(normalized);
		model.phone = normalized;
		phoneDisplayValue = formatted;
		target.value = formatted;
	}

	$effect(() => {
		const formatted = formatVietnamPhone(model.phone);
		if (phoneDisplayValue !== formatted) {
			phoneDisplayValue = formatted;
		}
	});

	async function subscribeUnsupportedArea() {
		subscriberMessage = '';
		subscriberError = '';
		if (!subscriberEmail) {
			subscriberError = 'Vui lòng nhập email để nhận thông báo.';
			return;
		}
		subscriberSubmitting = true;
		try {
			const res = await fetch('/api/subscribers', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					email: subscriberEmail,
					province: model.province,
					district: model.district || null
				})
			});
			const data = await res.json();
			if (!res.ok) {
				subscriberError = data.message ?? 'Không thể ghi nhận đăng ký lúc này.';
				return;
			}
			subscriberMessage = data.message ?? 'Đăng ký thành công.';
			subscriberEmail = '';
		} catch {
			subscriberError = 'Kết nối thất bại, vui lòng thử lại.';
		} finally {
			subscriberSubmitting = false;
		}
	}
</script>

<div class="relative grid gap-3 sm:grid-cols-2">
	<label class="text-sm sm:col-span-2">
		<span class="mb-1 block font-medium">Ngày nhận món</span>
		<select
			name="scheduledDate"
			bind:value={model.scheduledDate}
			class={`w-full rounded-xl border px-3 py-2 ${
				isInvalid('scheduledDate') ? 'border-red-400 ring-2 ring-red-200' : 'border-orange-200'
			}`}
			required
		>
			{#each dateOptions as option}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
	</label>
	<label class="text-sm sm:col-span-2">
		<span class="mb-1 block font-medium">Khung giờ nhận món (2 giờ)</span>
		<select
			name="scheduledSlot"
			bind:value={model.scheduledSlot}
			class={`w-full rounded-xl border px-3 py-2 ${
				isInvalid('scheduledSlot') ? 'border-red-400 ring-2 ring-red-200' : 'border-orange-200'
			}`}
			required
		>
			{#each slotOptions as option}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
	</label>
	<label class="text-sm sm:col-span-2">
		<span class="mb-1 block font-medium">Họ tên</span>
		<input
			name="customerName"
			bind:value={model.customerName}
			class={`w-full rounded-xl border px-3 py-2 ${
				isInvalid('customerName') ? 'border-red-400 ring-2 ring-red-200' : 'border-orange-200'
			}`}
			required
		/>
	</label>
	<label class="text-sm">
		<span class="mb-1 block font-medium">SĐT</span>
		<div
			class={`flex w-full items-center rounded-xl border bg-orange-50/70 transition focus-within:ring-2 ${
				isInvalid('phone')
					? 'border-red-400 focus-within:border-red-500 focus-within:ring-red-200'
					: 'border-orange-300 focus-within:border-orange-500 focus-within:ring-orange-200'
			}`}
		>
			<span
				class="inline-flex min-h-11 items-center gap-1 border-r border-orange-300 px-3 py-2 text-sm font-medium text-slate-700"
				aria-hidden="true"
			>
				<span>🇻🇳</span>
				<span>+84</span>
			</span>
			<input
				name="phone"
				value={phoneDisplayValue}
				oninput={onPhoneInput}
				type="tel"
				inputmode="numeric"
				pattern="[0-9 ]*"
				class="input-unstyled w-full rounded-r-xl border-0 bg-transparent px-3 py-2 outline-none ring-0 focus:outline-none"
				placeholder="0912 345 678"
				required
			/>
		</div>
	</label>
	<fieldset class="text-sm sm:col-span-2">
		<legend class="mb-1 block font-medium">Loại địa chỉ</legend>
		<div class="grid gap-2 sm:grid-cols-2">
			<label class="inline-flex items-center gap-2 rounded-xl border border-orange-200 px-3 py-2">
				<input type="radio" name="addressMode" value="old" bind:group={addressMode} />
				<span>Địa chỉ cũ (mặc định)</span>
			</label>
			<label class="inline-flex items-center gap-2 rounded-xl border border-orange-200 px-3 py-2">
				<input type="radio" name="addressMode" value="new" bind:group={addressMode} />
				<span>Địa chỉ mới</span>
			</label>
		</div>
	</fieldset>
	<label class="text-sm">
		<span class="mb-1 block font-medium">Thành phố/Tỉnh</span>
		<select
			name="province"
			bind:value={selectedProvinceCode}
			class={`w-full rounded-xl border px-3 py-2 ${
				isInvalid('province') ? 'border-red-400 ring-2 ring-red-200' : 'border-orange-200'
			}`}
			required
		>
			{#each provinceOptions as province}
				<option value={province.code}>{province.name}</option>
			{/each}
		</select>
	</label>
	<label class="text-sm">
		<span class="mb-1 block font-medium">Quận/Huyện</span>
		<select
			name="district"
			bind:value={model.district}
			class={`w-full rounded-xl border px-3 py-2 ${
				isInvalid('district') ? 'border-red-400 ring-2 ring-red-200' : 'border-orange-200'
			}`}
			required
			disabled={!isHcmProvince}
		>
			<option value="">Chọn Quận/Huyện</option>
			{#each districtOptions as district}
				<option value={district.name}>{district.name}</option>
			{/each}
		</select>
	</label>
	<label class="text-sm">
		<span class="mb-1 block font-medium">Phường</span>
		<select
			name="ward"
			bind:value={model.ward}
			class={`w-full rounded-xl border px-3 py-2 ${
				isInvalid('ward') ? 'border-red-400 ring-2 ring-red-200' : 'border-orange-200'
			}`}
			required
			disabled={!isHcmProvince || !model.district}
		>
			<option value="">Chọn Phường</option>
			{#each wardOptions as ward}
				<option value={ward}>{ward}</option>
			{/each}
		</select>
	</label>
	<label class="text-sm sm:col-span-2">
		<span class="mb-1 block font-medium">Số nhà, tên đường</span>
		<input
			name="address"
			bind:value={model.address}
			class={`w-full rounded-xl border px-3 py-2 ${
				isInvalid('address') ? 'border-red-400 ring-2 ring-red-200' : 'border-orange-200'
			}`}
			required
		/>
	</label>
	{#if !isHcmProvince}
		<div class="sm:col-span-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
			<p class="font-medium">Hiện tại quán chỉ hỗ trợ giao khu vực Thành phố Hồ Chí Minh.</p>
			<p class="mt-1">
				Quán đang cố gắng mở rộng sớm đến khu vực của bạn.
			</p>
			<div class="mt-3 space-y-2">
				<p class="font-medium">Bạn có muốn nhận thông báo khi quán hỗ trợ khu vực này không?</p>
				<div class="flex flex-wrap gap-3">
					<label class="inline-flex items-center gap-2">
						<input type="radio" name="subscriber" value="yes" bind:group={notifyWhenSupported} />
						<span>Có</span>
					</label>
					<label class="inline-flex items-center gap-2">
						<input type="radio" name="subscriber" value="no" bind:group={notifyWhenSupported} />
						<span>Không</span>
					</label>
				</div>
				{#if notifyWhenSupported === 'yes'}
					<div class="grid gap-2 sm:grid-cols-[1fr,auto]">
						<input
							type="email"
							bind:value={subscriberEmail}
							class="w-full rounded-xl border border-amber-300 bg-white px-3 py-2"
							placeholder="email@domain.com"
						/>
						<button
							class="btn-secondary"
							type="button"
							onclick={subscribeUnsupportedArea}
							disabled={subscriberSubmitting}
						>
							{subscriberSubmitting ? 'Đang gửi...' : 'Nhận thông báo'}
						</button>
					</div>
					{#if subscriberMessage}
						<p class="text-green-700">{subscriberMessage}</p>
					{/if}
					{#if subscriberError}
						<p class="text-red-700">{subscriberError}</p>
					{/if}
				{/if}
			</div>
		</div>
	{/if}
	<label class="text-sm sm:col-span-2">
		<span class="mb-1 block font-medium">Ghi chú</span>
		<textarea bind:value={model.note} class="h-24 w-full rounded-xl border border-orange-200 px-3 py-2"></textarea>
	</label>
	<div class="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden="true">
		<label>
			Website
			<input bind:value={model.website} autocomplete="off" tabindex="-1" />
		</label>
	</div>
</div>

{#if submitting}
	<p class="mt-2 text-sm text-slate-600">Đang gửi đơn hàng...</p>
{/if}
