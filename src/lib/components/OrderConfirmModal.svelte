<script lang="ts">
	import type { CartLine } from '$lib/types';
	import { formatCurrency } from '$lib/utils/format';

	let {
		form,
		lines = [] as CartLine[],
		totalAmount = 0,
		scheduledDateLabel = '',
		scheduledSlotLabel = '',
		submitting = false,
		onCancel = () => {},
		onConfirm = () => {}
	} = $props<{
		form: {
			customerName: string;
			phone: string;
			province: string;
			district: string;
			ward: string;
			address: string;
			note: string;
			scheduledDate: string;
			scheduledSlot: string;
		};
		lines: CartLine[];
		totalAmount: number;
		scheduledDateLabel?: string;
		scheduledSlotLabel?: string;
		submitting?: boolean;
		onCancel?: () => void;
		onConfirm?: () => void;
	}>();

	const restaurantNotes = $derived(
		Array.from(new Set(lines.map((line: CartLine) => line.itemNote?.trim()).filter(Boolean))) as string[]
	);
</script>

<div
	class="fixed inset-0 z-90 bg-black/40 p-3 sm:p-6"
	role="presentation"
	onclick={(event) => {
		if (event.target === event.currentTarget && !submitting) {
			onCancel();
		}
	}}
>
	<div class="mx-auto max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-card p-4 shadow-2xl sm:p-5">
		<div class="flex items-center justify-between gap-3">
			<h2 class="text-xl font-semibold">Xác nhận thông tin đơn hàng</h2>
			<button class="btn-secondary" type="button" onclick={onCancel} disabled={submitting}>Đóng</button>
		</div>

		<div class="mt-4 space-y-4 text-sm">
			<section class="rounded-xl border border-orange-100 bg-orange-50/40 p-3">
				<p class="font-medium">Thông tin khách hàng</p>
				<p class="mt-1">Họ tên: <strong>{form.customerName}</strong></p>
				<p>SĐT: <strong>{form.phone}</strong></p>
				<p>
					Địa chỉ:
					<strong>{form.address}, {form.ward}, {form.district}, {form.province}</strong>
				</p>
				<p>
					Ngày nhận món:
					<strong>{scheduledDateLabel || form.scheduledDate}</strong>
				</p>
				<p>
					Khung giờ nhận món:
					<strong>{scheduledSlotLabel || form.scheduledSlot}</strong>
				</p>
			</section>

			<section class="rounded-xl border border-orange-100 p-3">
				<p class="font-medium">Chi tiết đơn hàng</p>
				<div class="mt-2 space-y-2">
					{#each lines as line}
						<div class="flex items-start justify-between gap-3">
							<div>
								<p>{line.itemName} - {line.variantName}</p>
								<p class="text-xs text-slate-500">
									{line.quantity} x {formatCurrency(line.price)}
								</p>
							</div>
							<strong>{formatCurrency(line.price * line.quantity)}</strong>
						</div>
					{/each}
				</div>
				<div class="mt-3 border-t border-orange-100 pt-2">
					<div class="flex items-center justify-between">
						<span>Tạm tính</span>
						<strong>{formatCurrency(totalAmount)}</strong>
					</div>
					<div class="mt-1 flex items-center justify-between text-base">
						<span class="font-semibold">Tổng tiền món</span>
						<strong class="text-orange-700">{formatCurrency(totalAmount)}</strong>
					</div>
				</div>
			</section>

			{#if form.note}
				<section class="rounded-xl border border-slate-200 p-3">
					<p class="font-medium">Ghi chú của khách</p>
					<p class="mt-1 text-slate-700">{form.note}</p>
				</section>
			{/if}

			{#if restaurantNotes.length > 0}
				<section class="rounded-xl border border-amber-300 bg-amber-50 p-3">
					<p class="font-medium text-amber-900">Lưu ý từ nhà hàng</p>
					<ul class="mt-1 list-disc space-y-1 pl-5 text-amber-900">
						{#each restaurantNotes as note}
							<li>{note}</li>
						{/each}
					</ul>
				</section>
			{/if}

			<section class="rounded-xl border border-blue-200 bg-blue-50 p-3 text-blue-950">
				<p class="font-medium">Lưu ý vận chuyển</p>
				<p class="mt-1">Khách hàng thanh toán tiền món ăn cho nhà hàng.</p>
				<p class="mt-1">Nhà hàng sẽ tạo đơn bên vận chuyển và ưu tiên mức phí thấp nhất có thể cho bạn.</p>
				<p class="mt-1">Phí vận chuyển sẽ được nhà hàng xác nhận lại sau khi lên đơn giao hàng.</p>
			</section>
		</div>

		<div class="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
			<button class="btn-secondary" type="button" onclick={onCancel} disabled={submitting}>
				Quay lại chỉnh sửa
			</button>
			<button class="btn-primary" type="button" onclick={onConfirm} disabled={submitting}>
				{submitting ? 'Đang tạo đơn...' : 'Đặt hàng'}
			</button>
		</div>
	</div>
</div>
