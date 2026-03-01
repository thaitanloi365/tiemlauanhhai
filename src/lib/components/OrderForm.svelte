<script lang="ts">
	let {
		model,
		submitting = false
	} = $props<{
		model: {
			customerName: string;
			phone: string;
			province: string;
			district: string;
			ward: string;
			address: string;
			note: string;
		};
		submitting?: boolean;
	}>();
</script>

<div class="grid gap-3 sm:grid-cols-2">
	<label class="text-sm sm:col-span-2">
		<span class="mb-1 block font-medium">Họ tên</span>
		<input bind:value={model.customerName} class="w-full rounded-xl border border-orange-200 px-3 py-2" required />
	</label>
	<label class="text-sm">
		<span class="mb-1 block font-medium">SĐT</span>
		<input
			bind:value={model.phone}
			inputmode="tel"
			class="w-full rounded-xl border border-orange-200 px-3 py-2"
			placeholder="09xxxxxxxx"
			required
		/>
	</label>
	<label class="text-sm">
		<span class="mb-1 block font-medium">Tỉnh/Thành</span>
		<input bind:value={model.province} class="w-full rounded-xl border border-orange-200 px-3 py-2" required />
	</label>
	<label class="text-sm">
		<span class="mb-1 block font-medium">Quận/Huyện</span>
		<input bind:value={model.district} class="w-full rounded-xl border border-orange-200 px-3 py-2" required />
	</label>
	<label class="text-sm">
		<span class="mb-1 block font-medium">Phường/Xã</span>
		<input bind:value={model.ward} class="w-full rounded-xl border border-orange-200 px-3 py-2" required />
	</label>
	<label class="text-sm sm:col-span-2">
		<span class="mb-1 block font-medium">Địa chỉ chi tiết</span>
		<input bind:value={model.address} class="w-full rounded-xl border border-orange-200 px-3 py-2" required />
	</label>
	<label class="text-sm sm:col-span-2">
		<span class="mb-1 block font-medium">Ghi chú</span>
		<textarea bind:value={model.note} class="h-24 w-full rounded-xl border border-orange-200 px-3 py-2"></textarea>
	</label>
</div>

{#if submitting}
	<p class="mt-2 text-sm text-slate-600">Đang gửi đơn hàng...</p>
{/if}
