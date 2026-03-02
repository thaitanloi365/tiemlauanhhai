<script lang="ts">
	import { HCM_DISTRICTS_NEW } from '$lib/data/hcm-districts-new';
	import { HCM_DISTRICTS_OLD } from '$lib/data/hcm-districts-old';
	import { HCM_WARDS_NEW } from '$lib/data/hcm-wards-new';
	import { HCM_WARDS_OLD } from '$lib/data/hcm-wards-old';
	import { PROVINCES_NEW } from '$lib/data/provinces-new';
	import { HCMC_PROVINCE_CODE, HCMC_PROVINCE_NAME, PROVINCES_OLD } from '$lib/data/provinces-old';
	import PhoneInput from '$lib/components/PhoneInput.svelte';
	import SelectSearch from '$lib/components/SelectSearch.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';

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

	const formControlBaseClass = 'w-full rounded-xl border bg-orange-50/70 transition';
	const selectControlBaseClass = 'w-full rounded-xl border bg-orange-50/70';
	const phoneControlBaseClass =
		'w-full rounded-xl border bg-orange-50/70 px-0 py-0 transition focus:outline-none';
	const formControlValidClass = 'border-primary/70 focus:border-primary';
	const formControlInvalidClass =
		'border-red-400 focus:border-red-500';
	const radioOptionClass =
		'inline-flex items-center gap-2 rounded-xl border bg-orange-50/70 px-3 py-2 border-primary/70';

	function controlClass(field: string) {
		return `${formControlBaseClass} ${isInvalid(field) ? formControlInvalidClass : formControlValidClass}`;
	}

	function selectControlClass(field: string) {
		return `${selectControlBaseClass} ${isInvalid(field) ? formControlInvalidClass : formControlValidClass}`;
	}

function resetProvinceToHcm() {
	selectedProvinceCode = HCMC_PROVINCE_CODE;
	model.province = hcmProvinceName;
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

	const provinceOptions = $derived(addressMode === 'old' ? PROVINCES_OLD : PROVINCES_NEW);
	const provinceByCode = $derived(new Map(provinceOptions.map((province) => [province.code, province.name])));

	$effect(() => {
	if (!selectedProvinceCode) resetProvinceToHcm();
		if (!provinceByCode.has(selectedProvinceCode)) {
		resetProvinceToHcm();
		}
		model.province = provinceByCode.get(selectedProvinceCode) ?? '';
	});

	const isHcmProvince = $derived(selectedProvinceCode === HCMC_PROVINCE_CODE);
	const districtOptions = $derived(addressMode === 'old' ? HCM_DISTRICTS_OLD : HCM_DISTRICTS_NEW);
	const wardOptions = $derived(
		(addressMode === 'old' ? HCM_WARDS_OLD : HCM_WARDS_NEW)[model.district] ?? []
	);
	const selectedDateLabel = $derived(
		dateOptions.find((option: { value: string; label: string }) => option.value === model.scheduledDate)
			?.label ?? 'Chọn ngày nhận món'
	);
	const selectedSlotLabel = $derived(
		slotOptions.find((option: { value: string; label: string }) => option.value === model.scheduledSlot)
			?.label ?? 'Chọn khung giờ'
	);
	const selectedProvinceLabel = $derived(
		provinceByCode.get(selectedProvinceCode) ?? 'Chọn Thành phố/Tỉnh'
	);
	const provinceSelectOptions = $derived(
		provinceOptions.map((province) => ({
			value: province.code,
			label: province.name,
			keywords: [province.code]
		}))
	);
	const districtSelectOptions = $derived([
		{ value: '', label: 'Chọn Quận/Huyện' },
		...districtOptions.map((district) => ({ value: district.name, label: district.name }))
	]);
	const wardSelectOptions = $derived([
		{ value: '', label: 'Chọn Phường' },
		...wardOptions.map((ward) => ({ value: ward, label: ward }))
	]);

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
		resetProvinceToHcm();
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

<div class="relative space-y-5">
	<section class="space-y-3">
		<p class="text-sm font-semibold text-slate-800">Thời gian nhận món</p>
		<div class="grid gap-3 md:grid-cols-2">
			<label class="text-sm">
				<span class="mb-1 block font-medium">Ngày nhận món <span class="text-red-600">*</span></span>
				<Select.Root type="single" bind:value={model.scheduledDate}>
					<Select.Trigger class={selectControlClass('scheduledDate')} name="scheduledDate">
						{selectedDateLabel}
					</Select.Trigger>
					<Select.Content>
						{#each dateOptions as option}
							<Select.Item value={option.value} label={option.label}>{option.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</label>
			<label class="text-sm">
				<span class="mb-1 block font-medium"
					>Khung giờ nhận món (2 giờ) <span class="text-red-600">*</span></span
				>
				<Select.Root type="single" bind:value={model.scheduledSlot}>
					<Select.Trigger class={selectControlClass('scheduledSlot')} name="scheduledSlot">
						{selectedSlotLabel}
					</Select.Trigger>
					<Select.Content>
						{#each slotOptions as option}
							<Select.Item value={option.value} label={option.label}>{option.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</label>
		</div>
	</section>

	<Separator class="bg-orange-200/70" />

	<section class="space-y-3">
		<p class="text-sm font-semibold text-slate-800">Thông tin người nhận</p>
		<div class="grid gap-3 md:grid-cols-2">
			<label class="text-sm">
				<span class="mb-1 block font-medium">Họ tên <span class="text-red-600">*</span></span>
				<Input
					name="customerName"
					bind:value={model.customerName}
					class={controlClass('customerName')}
					required
				/>
			</label>
			<label class="text-sm">
				<span class="mb-1 block font-medium">SĐT <span class="text-red-600">*</span></span>
				<PhoneInput
					name="phone"
					bind:value={model.phone}
					invalid={isInvalid('phone')}
					controlClass={phoneControlBaseClass}
					validClass={formControlValidClass}
					invalidClass={formControlInvalidClass}
				/>
			</label>
		</div>
	</section>

	<Separator class="bg-orange-200/70" />

	<section class="space-y-3">
		<p class="text-sm font-semibold text-slate-800">Thông tin địa chỉ</p>
		<div class="space-y-3">
			<fieldset class="text-sm">
				<legend class="mb-1 block font-medium">Loại địa chỉ</legend>
				<RadioGroup.Root bind:value={addressMode} name="addressMode" class="grid gap-2 sm:grid-cols-2">
					<label class={radioOptionClass}>
						<RadioGroup.Item value="old" />
						<span>Địa chỉ cũ (mặc định)</span>
					</label>
					<label class={radioOptionClass}>
						<RadioGroup.Item value="new" />
						<span>Địa chỉ mới</span>
					</label>
				</RadioGroup.Root>
			</fieldset>
			<div class="grid gap-3 md:grid-cols-2">
				<label class="text-sm">
					<span class="mb-1 block font-medium">Thành phố/Tỉnh</span>
					<SelectSearch
						bind:value={selectedProvinceCode}
						name="province"
						options={provinceSelectOptions}
						placeholder={selectedProvinceLabel}
						searchPlaceholder="Tìm Tỉnh/Thành..."
						emptyText="Không tìm thấy Tỉnh/Thành phù hợp."
						class={selectControlClass('province')}
					/>
				</label>
				<label class="text-sm">
					<span class="mb-1 block font-medium">Quận/Huyện <span class="text-red-600">*</span></span>
					<SelectSearch
						bind:value={model.district}
						name="district"
						options={districtSelectOptions}
						placeholder="Chọn Quận/Huyện"
						searchPlaceholder="Tìm Quận/Huyện..."
						emptyText="Không tìm thấy Quận/Huyện phù hợp."
						disabled={!isHcmProvince}
						class={selectControlClass('district')}
					/>
				</label>
			</div>
			<div class="grid gap-3 md:grid-cols-2">
				<label class="text-sm">
					<span class="mb-1 block font-medium">Phường <span class="text-red-600">*</span></span>
					<SelectSearch
						bind:value={model.ward}
						name="ward"
						options={wardSelectOptions}
						placeholder="Chọn Phường"
						searchPlaceholder="Tìm Phường..."
						emptyText="Không tìm thấy Phường phù hợp."
						disabled={!isHcmProvince || !model.district}
						class={selectControlClass('ward')}
					/>
				</label>
				<label class="text-sm">
					<span class="mb-1 block font-medium"
						>Số nhà, tên đường <span class="text-red-600">*</span></span
					>
					<Input
						name="address"
						bind:value={model.address}
						class={controlClass('address')}
						required
					/>
				</label>
			</div>
			{#if !isHcmProvince}
				<div class="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
					<p class="font-medium">Hiện tại quán chỉ hỗ trợ giao khu vực Thành phố Hồ Chí Minh.</p>
					<p class="mt-1">
						Quán đang cố gắng mở rộng sớm đến khu vực của bạn.
					</p>
					<div class="mt-3 space-y-2">
						<p class="font-medium">Bạn có muốn nhận thông báo khi quán hỗ trợ khu vực này không?</p>
						<RadioGroup.Root
							bind:value={notifyWhenSupported}
							name="subscriber"
							class="flex flex-wrap gap-3"
						>
							<label class={radioOptionClass}>
								<RadioGroup.Item value="yes" />
								<span>Có</span>
							</label>
							<label class={radioOptionClass}>
								<RadioGroup.Item value="no" />
								<span>Không</span>
							</label>
						</RadioGroup.Root>
						{#if notifyWhenSupported === 'yes'}
							<div class="grid gap-2 sm:grid-cols-[1fr,auto]">
								<Input
									type="email"
									bind:value={subscriberEmail}
									class="w-full rounded-xl border-amber-300 bg-white"
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
		</div>
	</section>

	<Separator class="bg-orange-200/70" />

	<section class="space-y-3">
		<label class="text-sm">
			<span class="mb-1 block font-medium">Ghi chú</span>
			<Textarea
				bind:value={model.note}
				class={`h-24 ${formControlBaseClass} ${formControlValidClass}`}
			/>
		</label>
	</section>
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
