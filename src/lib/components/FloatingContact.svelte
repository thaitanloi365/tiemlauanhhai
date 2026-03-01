<script lang="ts">
	import { fade, fly, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	const links = {
		phone: 'tel:0900000000',
		zalo: 'https://zalo.me',
		facebook: 'https://facebook.com'
	};

	let open = $state(false);
</script>

{#if open}
	<button
		type="button"
		class="fixed inset-0 z-30 bg-transparent"
		aria-label="Đóng menu liên hệ nhanh"
		onclick={() => (open = false)}
		transition:fade={{ duration: 140 }}
	></button>
{/if}

<div class="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2 md:bottom-6">
	{#if open}
		<a
			href={links.facebook}
			target="_blank"
			rel="noreferrer"
			aria-label="Liên hệ Facebook"
			class="inline-flex size-12 items-center justify-center rounded-full border border-orange-200 bg-white text-orange-700 shadow-lg"
			transition:fly={{ y: 10, duration: 200, easing: cubicOut }}
		>
			<svg viewBox="0 0 24 24" class="size-5" fill="currentColor" aria-hidden="true">
				<path d="M13.5 21v-7h2.3l.4-2.8h-2.7V9.4c0-.8.2-1.4 1.4-1.4h1.5V5.5c-.3 0-1.2-.1-2.3-.1-2.2 0-3.8 1.3-3.8 3.9v2h-2.5V14h2.5v7h3.2Z" />
			</svg>
		</a>
		<a
			href={links.zalo}
			target="_blank"
			rel="noreferrer"
			aria-label="Liên hệ Zalo"
			class="inline-flex size-12 items-center justify-center rounded-full border border-orange-200 bg-white text-orange-700 shadow-lg"
			transition:fly={{ y: 10, duration: 240, easing: cubicOut }}
		>
			<svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
				<rect x="3.5" y="4.5" width="17" height="13" rx="4"></rect>
				<path d="m8 20.5 2.9-2.9h2.6"></path>
				<path d="M8 9h3.8L8.2 14h3.9"></path>
			</svg>
		</a>
		<a
			href={links.phone}
			aria-label="Gọi hotline"
			class="inline-flex size-12 items-center justify-center rounded-full border border-orange-200 bg-white text-orange-700 shadow-lg"
			transition:fly={{ y: 10, duration: 280, easing: cubicOut }}
		>
			<svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
				<path d="M21 16.6v3a2 2 0 0 1-2.2 2A19.9 19.9 0 0 1 10 18.4a19.5 19.5 0 0 1-6.4-6.4A19.9 19.9 0 0 1 .4 3.2 2 2 0 0 1 2.4 1h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.4 2.1L6.4 8.6a16 16 0 0 0 6.9 6.9l1.2-1.2a2 2 0 0 1 2.1-.4c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.8 2.1Z"></path>
			</svg>
		</a>
	{/if}

	<button
		type="button"
		class="inline-flex size-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-xl transition hover:bg-orange-600 active:scale-95"
		aria-label={open ? 'Đóng liên hệ nhanh' : 'Mở liên hệ nhanh'}
		onclick={() => (open = !open)}
		transition:scale={{ duration: 200 }}
	>
		<span class={`text-3xl leading-none transition-transform duration-300 ${open ? 'rotate-45' : 'rotate-0'}`}>
			+
		</span>
	</button>
</div>
