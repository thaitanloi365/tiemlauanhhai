<script lang="ts">
	import { page } from '$app/state';
	import AdminSidebar from '$lib/components/admin/AdminSidebar.svelte';
	import { Button } from '$lib/components/ui/button/index.js';

	let { data, children } = $props();
	let sidebarOpen = $state(false);

	const isLoginPage = $derived(page.url.pathname === '/admin/login');
</script>

{#if isLoginPage}
	{@render children()}
{:else}
	<AdminSidebar
		adminEmail={data.adminUser?.email ?? 'Admin'}
		adminRole={data.adminUser?.role}
		open={sidebarOpen}
		onClose={() => (sidebarOpen = false)}
	/>

	<div class="admin-area lg:pl-64">
		<header class="sticky top-0 z-30 border-b border-orange-200 bg-orange-50/95 backdrop-blur">
			<div class="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
				<div class="flex items-center gap-3">
					<!-- svelte-ignore a11y_consider_explicit_label -->
					<Button type="button" variant="outline" size="icon" class="lg:hidden" onclick={() => (sidebarOpen = true)}>
						<svg viewBox="0 0 20 20" class="size-5 fill-current" aria-hidden="true">
							<path d="M3 5h14v2H3V5Zm0 4h14v2H3V9Zm0 4h14v2H3v-2Z"></path>
						</svg>
					</Button>
					<div>
						<p class="text-sm text-slate-500">Khu vực quản trị</p>
						<p class="font-semibold">Admin Dashboard</p>
					</div>
				</div>
				<p class="hidden text-sm text-slate-600 sm:block">{data.adminUser?.email}</p>
			</div>
		</header>

		<main class="min-h-[calc(100dvh-4rem)] px-4 py-6 sm:px-6">
			{@render children()}
		</main>
	</div>
{/if}
