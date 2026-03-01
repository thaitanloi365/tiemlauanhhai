<script lang="ts">
	import { page } from '$app/state';
	import { LOGO_IMAGE } from '$lib/constants/assets';
	import { cubicOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={LOGO_IMAGE} />
	<meta name="theme-color" content="#F47B20" />
</svelte:head>

{#key page.url.pathname}
	<div in:fly={{ y: 20, duration: 300, easing: cubicOut }} out:fly={{ y: -10, duration: 200, easing: cubicOut }}>
		{@render children()}
	</div>
{/key}
