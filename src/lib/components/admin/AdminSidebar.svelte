<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { LOGO_IMAGE } from '$lib/constants/assets';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';

	let { adminEmail, adminRole = 'manager', open = false, onClose } = $props<{
		adminEmail: string;
		adminRole?: 'super_admin' | 'manager';
		open?: boolean;
		onClose?: () => void;
	}>();

	const navItems = $derived.by(() => {
		const items = [
			{ href: '/admin', label: 'Dashboard' },
			{ href: '/admin/statistics', label: 'Thống kê' },
			{ href: '/admin/menu', label: 'Menu' },
			{ href: '/admin/orders', label: 'Đơn hàng' }
		];
		if (adminRole === 'super_admin') {
			items.push({ href: '/admin/employees', label: 'Nhân viên' });
		}
		items.push({ href: '/admin/settings', label: 'Cài đặt' });
		return items;
	});

	let showLogoutConfirm = $state(false);

	async function logout() {
		await fetch('/api/admin/auth/logout', { method: 'POST' });
		window.location.href = '/admin/login';
	}

	function isActive(path: string) {
		if (path === '/admin') return page.url.pathname === path;
		return page.url.pathname.startsWith(path);
	}
</script>

<aside class="hidden w-64 flex-col border-r bg-[#2f1e14] text-orange-50 lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex">
	<div class="px-5 py-4">
		<div class="flex items-center gap-3">
			<img src={LOGO_IMAGE} alt="Logo Tiệm Lẩu Anh Hai" loading="eager" decoding="async" class="size-9 rounded-md object-contain" />
			<div>
				<p class="text-xs uppercase tracking-wide text-orange-200/70">Tiệm Lẩu Anh Hai</p>
				<p class="mt-1 text-xl font-semibold">Admin Panel</p>
			</div>
		</div>
		<p class="mt-2 truncate text-sm text-orange-100/80">{adminEmail}</p>
	</div>
	<Separator class="bg-orange-200/20" />

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

	<div class="p-3">
		<Button type="button" class="w-full" onclick={() => (showLogoutConfirm = true)}>
			Đăng xuất
		</Button>
	</div>
</aside>

<Sheet.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose?.()}>
	<Sheet.Content side="left" class="w-[280px] bg-[#2f1e14] p-0 text-orange-50">
		<div class="px-5 py-4">
			<div class="flex items-center gap-3">
				<img src={LOGO_IMAGE} alt="Logo Tiệm Lẩu Anh Hai" loading="eager" decoding="async" class="size-9 rounded-md object-contain" />
				<div>
					<p class="text-xs uppercase tracking-wide text-orange-200/70">Tiệm Lẩu Anh Hai</p>
					<p class="mt-1 text-xl font-semibold">Admin Panel</p>
				</div>
			</div>
			<p class="mt-2 truncate text-sm text-orange-100/80">{adminEmail}</p>
		</div>
		<Separator class="bg-orange-200/20" />

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

		<div class="p-3">
			<Button type="button" class="w-full" onclick={() => (showLogoutConfirm = true)}>Đăng xuất</Button>
		</div>
	</Sheet.Content>
</Sheet.Root>

{#if showLogoutConfirm}
	<Dialog.Root open={showLogoutConfirm} onOpenChange={(nextOpen) => (showLogoutConfirm = nextOpen)}>
		<Dialog.Portal>
			<Dialog.Overlay />
			<Dialog.Content class="sm:max-w-sm">
				<Dialog.Header>
					<Dialog.Title>Xác nhận đăng xuất</Dialog.Title>
					<Dialog.Description>Bạn có chắc muốn đăng xuất khỏi trang quản trị không?</Dialog.Description>
				</Dialog.Header>
				<Dialog.Footer>
					<Button type="button" variant="outline" onclick={() => (showLogoutConfirm = false)}>Hủy</Button>
					<Button type="button" onclick={logout}>Đăng xuất</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Portal>
	</Dialog.Root>
{/if}
