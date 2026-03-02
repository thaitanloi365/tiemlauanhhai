<script lang="ts">
	import { dev } from '$app/environment';
	import { onNavigate } from '$app/navigation';
	import { inject } from '@vercel/analytics';
	import { injectSpeedInsights } from '@vercel/speed-insights';
	import { LOGO_IMAGE } from '$lib/constants/assets';
	import '../app.css';

	let { children } = $props();

	if (!dev) {
		inject();
		injectSpeedInsights();
	}

	const isAdminPath = (pathname?: string | null) => pathname === '/admin' || pathname?.startsWith('/admin/');

	onNavigate((navigation) => {
		const startViewTransition = document.startViewTransition?.bind(document);
		if (!startViewTransition) return;
		const fromPath = navigation.from?.url.pathname ?? null;
		const toPath = navigation.to?.url.pathname ?? null;
		if (isAdminPath(fromPath) || isAdminPath(toPath)) return;

		return new Promise<void>((resolve) => {
			startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<svelte:head>
	<link rel="icon" href={LOGO_IMAGE} />
	<meta name="theme-color" content="#F47B20" />
</svelte:head>

{@render children()}
