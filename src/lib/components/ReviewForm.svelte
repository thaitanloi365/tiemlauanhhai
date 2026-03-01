<script lang="ts">
	let {
		onSubmit,
		disabled = false
	} = $props<{
		onSubmit: (rating: number, comment: string) => Promise<void> | void;
		disabled?: boolean;
	}>();

	let rating = $state(5);
	let comment = $state('');
	let loading = $state(false);

	async function submit() {
		loading = true;
		try {
			await onSubmit(rating, comment);
			comment = '';
		} finally {
			loading = false;
		}
	}
</script>

<div class="card-surface p-4">
	<h3 class="text-lg font-semibold">Đánh giá đơn hàng</h3>
	<div class="mt-3 flex gap-2">
		{#each [1, 2, 3, 4, 5] as star}
			<button
				type="button"
				class={`size-10 rounded-full border text-lg ${
					star <= rating ? 'border-orange-400 bg-orange-100' : 'border-orange-100'
				}`}
				onclick={() => (rating = star)}
				disabled={disabled || loading}
			>
				★
			</button>
		{/each}
	</div>
	<textarea
		class="mt-3 h-24 w-full rounded-xl border border-orange-200 px-3 py-2"
		bind:value={comment}
		placeholder="Chia sẻ trải nghiệm món ăn..."
		disabled={disabled || loading}
	></textarea>
	<button class="btn-primary mt-3 w-full" type="button" onclick={submit} disabled={disabled || loading}>
		{loading ? 'Đang gửi...' : 'Gửi đánh giá'}
	</button>
</div>
