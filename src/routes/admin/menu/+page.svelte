<script lang="ts">
	import { MENU_IMAGE } from '$lib/constants/assets';
	import MenuItemForm from '$lib/components/admin/MenuItemForm.svelte';

	let items = $state<any[]>([]);
	let categories = $state<any[]>([]);
	let loading = $state(true);
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

	async function loadMenu() {
		loading = true;
		const res = await fetch('/api/admin/menu');
		const data = await res.json();
		if (res.ok) {
			items = data.items ?? [];
			categories = data.categories ?? [];
		} else {
			message = data.message ?? 'Không tải được menu';
		}
		loading = false;
	}

	function openCreateForm() {
		selectedItem = null;
		showForm = true;
	}

	function openEditForm(item: any) {
		selectedItem = item;
		showForm = true;
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
		if (res.ok) loadMenu();
	}

	$effect(() => {
		loadMenu();
	});
</script>

<main class="container-shell space-y-4">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="text-3xl font-bold">Quản lý menu</h1>
			<p class="mt-1 text-sm text-slate-600">Thêm, chỉnh sửa món và quản lý trạng thái hiển thị.</p>
		</div>
		<button class="btn-primary" type="button" onclick={openCreateForm}>Thêm món mới</button>
	</div>

	<section class="card-surface p-4">
		<div class="grid gap-3 md:grid-cols-3">
			<input
				class="rounded-xl border border-orange-200 bg-white px-3 py-2"
				bind:value={search}
				placeholder="Tìm theo tên món"
			/>
			<select class="rounded-xl border border-orange-200 bg-white px-3 py-2" bind:value={categoryFilter}>
				<option value="all">Tất cả danh mục</option>
				{#each categories as category}
					<option value={category.id}>{category.name}</option>
				{/each}
			</select>
			<select class="rounded-xl border border-orange-200 bg-white px-3 py-2" bind:value={availabilityFilter}>
				<option value="all">Tất cả trạng thái</option>
				<option value="available">Đang bán</option>
				<option value="hidden">Đang ẩn</option>
			</select>
		</div>
	</section>

	{#if message}
		<p class="rounded-lg bg-orange-100 px-3 py-2 text-sm text-orange-900">{message}</p>
	{/if}

	<section class="card-surface p-4">
		<div class="flex items-center justify-between">
			<h2 class="text-xl font-semibold">Danh sách món</h2>
			<p class="text-sm text-slate-600">{filteredItems.length} món</p>
		</div>

		{#if loading}
			<p class="mt-3 text-sm">Đang tải...</p>
		{:else if filteredItems.length === 0}
			<p class="mt-3 rounded-xl bg-white px-3 py-4 text-sm text-slate-600">Không có món nào khớp bộ lọc.</p>
		{:else}
			<div class="mt-4 grid gap-3 lg:grid-cols-2">
				{#each filteredItems as item}
					<div class="rounded-xl border border-orange-200 bg-white p-3 shadow-sm">
						<div class="flex gap-3">
							<img src={item.thumbnail_url || MENU_IMAGE} alt={item.name} class="h-20 w-20 rounded-lg object-cover" />
							<div class="min-w-0 flex-1">
								<p class="truncate font-semibold">{item.name}</p>
								<p class="truncate text-xs text-slate-500">{item.slug}</p>
								<div class="mt-2 flex flex-wrap items-center gap-2">
									<span class="rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-800">
										{categoryNameMap.get(item.category_id) ?? 'Danh mục'}
									</span>
									<span class={`rounded-full px-2 py-1 text-xs font-medium ${item.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
										{item.is_available ? 'Đang bán' : 'Đang ẩn'}
									</span>
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
								<span class="relative h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500">
									<span class="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition peer-checked:translate-x-5"></span>
								</span>
								<span>{item.is_available ? 'Đang bán' : 'Đang ẩn'}</span>
							</label>
							<button class="btn-secondary px-3 py-2 text-sm" type="button" onclick={() => openEditForm(item)}>Chỉnh sửa</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>
</main>

<MenuItemForm
	open={showForm}
	categories={categories}
	item={selectedItem}
	onClose={() => (showForm = false)}
	onSaved={loadMenu}
/>
