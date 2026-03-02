<script lang="ts">
	import { MENU_IMAGE } from '$lib/constants/assets';
	import MenuItemForm from '$lib/components/admin/MenuItemForm.svelte';
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';

	const queryClient = useQueryClient();
	let items = $state<any[]>([]);
	let categories = $state<any[]>([]);
	let message = $state('');
	let savingId = $state<string | null>(null);

	let search = $state('');
	let categoryFilter = $state('all');
	let availabilityFilter = $state<'all' | 'available' | 'hidden'>('all');

	let showForm = $state(false);
	let selectedItem = $state<any | null>(null);

	const categoryNameMap = $derived(
		new Map<string, string>((categories ?? []).map((category) => [category.id, category.name]))
	);

	const filteredItems = $derived.by(() => {
		return (items ?? []).filter((item) => {
			const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase().trim());
			const matchesCategory = categoryFilter === 'all' || item.category_id === categoryFilter;
			const matchesAvailability =
				availabilityFilter === 'all' ||
				(availabilityFilter === 'available' && item.is_available) ||
				(availabilityFilter === 'hidden' && !item.is_available);
			return matchesSearch && matchesCategory && matchesAvailability;
		});
	});

	const menuQuery = createQuery(() => ({
		queryKey: ['admin', 'menu'],
		queryFn: async () => {
			const res = await fetch('/api/admin/menu', { cache: 'no-store' });
			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.message ?? 'Không tải được menu');
			}
			return data;
		}
	}));

	function openCreateForm() {
		selectedItem = null;
		showForm = true;
	}

	function openEditForm(item: any) {
		selectedItem = item;
		showForm = true;
	}

	function handleSaved(savedItem?: any) {
		if (savedItem?.id) {
			queryClient.setQueryData(['admin', 'menu'], (previous: any) => {
				if (!previous) return previous;
				const previousItems = previous.items ?? [];
				const exists = previousItems.some((entry: any) => entry.id === savedItem.id);
				const items = exists
					? previousItems.map((entry: any) => (entry.id === savedItem.id ? { ...entry, ...savedItem } : entry))
					: [savedItem, ...previousItems];
				return {
					...previous,
					items
				};
			});
		}
		queryClient.invalidateQueries({ queryKey: ['admin', 'menu'] });
	}

	async function toggleAvailable(item: any) {
		savingId = item.id;
		const res = await fetch(`/api/admin/menu/${item.id}`, {
			method: 'PATCH',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				categoryId: item.category_id,
				name: item.name,
				description: item.description,
				ingredients: item.ingredients,
				note: item.note,
				preparationTimeMinutes: item.preparation_time_minutes,
				thumbnailUrl: item.thumbnail_url ?? MENU_IMAGE,
				isAvailable: !item.is_available,
				isTopping: item.is_topping,
				sortOrder: item.sort_order,
				media: (item.media ?? []).map((entry: any) => ({
					type: entry.type,
					url: entry.url,
					altText: entry.alt_text ?? null
				}))
			})
		});
		const data = await res.json();
		message = res.ok ? '' : (data.message ?? 'Không cập nhật được trạng thái');
		savingId = null;
		if (res.ok) await queryClient.invalidateQueries({ queryKey: ['admin', 'menu'] });
	}

	$effect(() => {
		if (!menuQuery.data) return;
		items = menuQuery.data.items ?? [];
		categories = menuQuery.data.categories ?? [];
	});
</script>

<main class="container-shell space-y-4">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="text-3xl font-bold">Quản lý menu</h1>
			<p class="mt-1 text-sm text-muted-foreground">Thêm, chỉnh sửa món và quản lý trạng thái hiển thị.</p>
		</div>
		<Button type="button" onclick={openCreateForm}>Thêm món mới</Button>
	</div>

	<Card.Root>
		<Card.Content class="px-4 py-1">
		<div class="grid gap-3 md:grid-cols-3">
			<Input bind:value={search} placeholder="Tìm theo tên món" />
			<Select.Root type="single" bind:value={categoryFilter}>
				<Select.Trigger class="w-full">
					{categoryFilter === 'all' ? 'Tất cả danh mục' : (categories.find((c) => c.id === categoryFilter)?.name ?? 'Danh mục')}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="all" label="Tất cả danh mục">Tất cả danh mục</Select.Item>
					{#each categories as category}
						<Select.Item value={category.id} label={category.name}>{category.name}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<Select.Root type="single" bind:value={availabilityFilter}>
				<Select.Trigger class="w-full">
					{availabilityFilter === 'all' ? 'Tất cả trạng thái' : availabilityFilter === 'available' ? 'Đang bán' : 'Đang ẩn'}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="all" label="Tất cả trạng thái">Tất cả trạng thái</Select.Item>
					<Select.Item value="available" label="Đang bán">Đang bán</Select.Item>
					<Select.Item value="hidden" label="Đang ẩn">Đang ẩn</Select.Item>
				</Select.Content>
			</Select.Root>
		</div>
		</Card.Content>
	</Card.Root>

	{#if message}
		<p class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</p>
	{/if}

	<Card.Root>
		<Card.Content class="p-4">
		<div class="flex items-center justify-between">
			<h2 class="text-xl font-semibold">Danh sách món</h2>
			<p class="text-sm text-muted-foreground">{filteredItems.length} món</p>
		</div>

		{#if menuQuery.isPending}
			<div class="mt-4 grid gap-3 lg:grid-cols-2">
				{#each Array.from({ length: 6 }) as _, index (`menu-skeleton-${index}`)}
					<div class="rounded-xl border border-orange-200 bg-orange-50/80 p-3">
						<div class="animate-pulse">
							<div class="flex gap-3">
								<div class="h-20 w-20 rounded-lg bg-orange-100"></div>
								<div class="min-w-0 flex-1 space-y-2">
									<div class="h-4 w-2/3 rounded bg-orange-200/70"></div>
									<div class="h-3 w-1/2 rounded bg-orange-100"></div>
									<div class="h-5 w-24 rounded-full bg-orange-100"></div>
								</div>
							</div>
							<div class="mt-3 h-9 rounded-lg border border-orange-100 bg-orange-50/60"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else if menuQuery.isError}
			<p class="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-3 text-sm text-destructive">
				{menuQuery.error?.message ?? 'Không tải được menu'}
			</p>
		{:else if filteredItems.length === 0}
			<p class="mt-3 rounded-xl bg-muted/60 px-3 py-4 text-sm text-muted-foreground">
				Không có món nào khớp bộ lọc.
			</p>
		{:else}
			<div class="mt-4 grid gap-3 lg:grid-cols-2">
				{#each filteredItems as item}
					<div class="rounded-xl border border-orange-200 bg-orange-50/80 p-3">
						<div class="flex gap-3">
							<img src={item.thumbnail_url || MENU_IMAGE} alt={item.name} class="h-20 w-20 rounded-lg object-cover" />
							<div class="min-w-0 flex-1">
								<p class="truncate font-semibold">{item.name}</p>
								<p class="truncate text-xs text-slate-500">{item.slug}</p>
								<div class="mt-2 flex flex-wrap items-center gap-2">
									<Badge variant="secondary">
										{categoryNameMap.get(item.category_id) ?? 'Danh mục'}
									</Badge>
									<Badge variant={item.is_available ? 'default' : 'outline'}>
										{item.is_available ? 'Đang bán' : 'Đang ẩn'}
									</Badge>
								</div>
							</div>
						</div>

						<div class="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-orange-100 pt-3">
							<label class="inline-flex cursor-pointer items-center gap-2 text-sm">
								<input
									class="peer sr-only"
									type="checkbox"
									checked={item.is_available}
									disabled={savingId === item.id}
									onchange={() => toggleAvailable(item)}
								/>
								<span class="relative h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-orange-500">
									<span class="absolute left-0.5 top-0.5 size-5 rounded-full bg-white transition peer-checked:translate-x-5"></span>
								</span>
								<span>{item.is_available ? 'Đang bán' : 'Đang ẩn'}</span>
							</label>
							<Button variant="outline" size="sm" type="button" onclick={() => openEditForm(item)}>Chỉnh sửa</Button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
		</Card.Content>
	</Card.Root>
</main>

<MenuItemForm
	open={showForm}
	categories={categories}
	item={selectedItem}
	onClose={() => (showForm = false)}
	onSaved={handleSaved}
/>
