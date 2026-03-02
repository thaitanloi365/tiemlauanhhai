<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';

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

<Card.Root>
	<Card.Content class="p-4">
	<h3 class="text-lg font-semibold">Đánh giá đơn hàng</h3>
	<div class="mt-3 flex gap-2">
		{#each [1, 2, 3, 4, 5] as star}
			<Button
				type="button"
				variant={star <= rating ? 'default' : 'outline'}
				size="icon"
				class="rounded-full text-lg"
				onclick={() => (rating = star)}
				disabled={disabled || loading}
			>
				★
			</Button>
		{/each}
	</div>
	<Textarea
		class="mt-3 h-24"
		bind:value={comment}
		placeholder="Chia sẻ trải nghiệm món ăn..."
		disabled={disabled || loading}
	></Textarea>
	<Button class="mt-3 w-full" type="button" onclick={submit} disabled={disabled || loading}>
		{loading ? 'Đang gửi...' : 'Gửi đánh giá'}
	</Button>
	</Card.Content>
</Card.Root>
