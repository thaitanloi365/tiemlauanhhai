<script lang="ts">
	import { page } from '$app/state';

	let { adminEmail, open = false, onClose } = $props<{
		adminEmail: string;
		open?: boolean;
		onClose?: () => void;
	}>();

	const navItems = [
		{ href: '/admin', label: 'Dashboard' },
		{ href: '/admin/menu', label: 'Menu' },
		{ href: '/admin/orders', label: 'Đơn hàng' }
	];

	async function logout() {
		await fetch('/api/admin/auth/logout', { method: 'POST' });
		window.location.href = '/admin/login';
	}

	function isActive(path: string) {
		if (path === '/admin') return page.url.pathname === path;
		return page.url.pathname.startsWith(path);
	}
</script>

<div
	class={`fixed inset-0 z-40 bg-black/40 lg:hidden ${open ? '' : 'pointer-events-none opacity-0'}`}
	role="button"
	tabindex={open ? 0 : -1}
	aria-label="Đóng menu quản trị"
	onclick={onClose}
	onkeydown={(event) => (event.key === 'Escape' || event.key === 'Enter') && onClose?.()}
></div>

<aside
	class={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-orange-200 bg-[#2f1e14] text-orange-50 transition-transform lg:translate-x-0 ${
		open ? 'translate-x-0' : '-translate-x-full'
	}`}
>
	<div class="border-b border-orange-200/20 px-5 py-4">
		<p class="text-xs uppercase tracking-wide text-orange-200/70">Tiệm Lẩu Anh Hai</p>
		<p class="mt-1 text-xl font-semibold">Admin Panel</p>
		<p class="mt-2 truncate text-sm text-orange-100/80">{adminEmail}</p>
	</div>

	<nav class="flex-1 space-y-1 px-3 py-4">
		{#each navItems as item}
			<a
				href={item.href}
				onclick={onClose}
				class={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
					isActive(item.href) ? 'bg-orange-500 text-white' : 'text-orange-100 hover:bg-orange-100/15'
				}`}
			>
				{item.label}
			</a>
		{/each}
	</nav>

	<div class="border-t border-orange-200/20 p-3">
		<button type="button" class="w-full rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white" onclick={logout}>
			Đăng xuất
		</button>
	</div>
</aside>
