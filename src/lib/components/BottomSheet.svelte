<script lang="ts">
	let {
		open = false,
		title = '',
		onClose = () => {},
		children
	} = $props<{ open?: boolean; title?: string; onClose?: () => void; children: any }>();
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 bg-black/40"
		role="presentation"
		tabindex="0"
		onclick={onClose}
		onkeydown={(event) => event.key === 'Escape' && onClose()}
	>
		<section
			class="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-card p-4"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			onclick={(event) => event.stopPropagation()}
		>
			<div class="mb-3 flex items-center justify-between">
				<h2 class="text-lg font-semibold">{title}</h2>
				<button type="button" class="btn-secondary" onclick={onClose}>Đóng</button>
			</div>
			{@render children()}
		</section>
	</div>
{/if}
