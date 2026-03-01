<script lang="ts">
	import { MENU_IMAGE } from '$lib/constants/assets';

	type CategoryOption = { id: string; name: string };
	type MediaEntry = { type: 'image' | 'video'; url: string; altText?: string | null };
	type MenuItemInput = {
		id?: string;
		name: string;
		category_id: string;
		description?: string | null;
		ingredients?: string | null;
		thumbnail_url?: string | null;
		is_topping?: boolean;
		sort_order?: number;
		media?: { type: 'image' | 'video'; url: string; alt_text?: string | null }[];
	};

	let { open = false, categories = [], item = null, onClose, onSaved } = $props<{
		open?: boolean;
		categories?: CategoryOption[];
		item?: MenuItemInput | null;
		onClose?: () => void;
		onSaved?: () => void;
	}>();

	const isEdit = $derived(Boolean(item?.id));

	let lastKey = $state('');
	let saving = $state(false);
	let uploading = $state(false);
	let message = $state('');

	let form = $state({
		name: '',
		categoryId: '',
		description: '',
		ingredients: '',
		thumbnailUrl: MENU_IMAGE,
		isTopping: false,
		sortOrder: 99
	});
	let media = $state<MediaEntry[]>([]);

	function resetForm() {
		form.name = item?.name ?? '';
		form.categoryId = item?.category_id ?? categories[0]?.id ?? '';
		form.description = item?.description ?? '';
		form.ingredients = item?.ingredients ?? '';
		form.thumbnailUrl = item?.thumbnail_url ?? MENU_IMAGE;
		form.isTopping = Boolean(item?.is_topping);
		form.sortOrder = item?.sort_order ?? 99;
		media =
			item?.media?.map((entry: { type: 'image' | 'video'; url: string; alt_text?: string | null }) => ({
				type: entry.type,
				url: entry.url,
				altText: entry.alt_text ?? null
			})) ?? [];
		message = '';
	}

	$effect(() => {
		const key = `${open}-${item?.id ?? 'new'}-${categories.length}`;
		if (key === lastKey || !open) return;
		lastKey = key;
		resetForm();
	});

	function addMediaEntries(entries: MediaEntry[]) {
		media = [...media, ...entries];
		const firstImage = entries.find((entry) => entry.type === 'image');
		if (firstImage && (!form.thumbnailUrl || form.thumbnailUrl === MENU_IMAGE)) {
			form.thumbnailUrl = firstImage.url;
		}
	}

	async function uploadSelectedFiles(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const files = Array.from(input.files ?? []);
		if (files.length === 0) return;

		uploading = true;
		message = '';

		const formData = new FormData();
		for (const file of files) {
			formData.append('files', file);
		}

		const res = await fetch('/api/admin/upload', {
			method: 'POST',
			body: formData
		});
		const data = await res.json();
		uploading = false;
		input.value = '';

		if (!res.ok) {
			message = data.message ?? 'Upload thất bại';
			return;
		}

		addMediaEntries(data.files ?? []);
	}

	async function uploadThumbnailFile(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		uploading = true;
		message = '';

		const formData = new FormData();
		formData.append('files', file);

		const res = await fetch('/api/admin/upload', {
			method: 'POST',
			body: formData
		});
		const data = await res.json();
		uploading = false;
		input.value = '';

		if (!res.ok) {
			message = data.message ?? 'Upload thumbnail thất bại';
			return;
		}

		const uploadedFiles = (data.files ?? []) as MediaEntry[];
		const firstImage = uploadedFiles.find((entry) => entry.type === 'image');
		if (!firstImage?.url) {
			message = 'Không tìm thấy ảnh hợp lệ sau khi upload.';
			return;
		}

		form.thumbnailUrl = firstImage.url;
	}

	function removeMedia(index: number) {
		media = media.filter((_, i) => i !== index);
	}

	function setThumbnail(url: string) {
		form.thumbnailUrl = url;
	}

	async function submit() {
		if (!form.name.trim() || !form.categoryId) {
			message = 'Vui lòng nhập tên món và chọn danh mục.';
			return;
		}

		saving = true;
		message = '';

		const payload = {
			name: form.name.trim(),
			categoryId: form.categoryId,
			description: form.description.trim() || null,
			ingredients: form.ingredients.trim() || null,
			thumbnailUrl: form.thumbnailUrl.trim() || null,
			isTopping: form.isTopping,
			sortOrder: Number(form.sortOrder || 0),
			media: media.map((entry) => ({
				type: entry.type,
				url: entry.url,
				altText: entry.altText ?? null
			}))
		};

		const endpoint = isEdit ? `/api/admin/menu/${item?.id}` : '/api/admin/menu';
		const method = isEdit ? 'PATCH' : 'POST';
		const res = await fetch(endpoint, {
			method,
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload)
		});
		const data = await res.json();
		saving = false;

		if (!res.ok) {
			message = data.message ?? 'Không lưu được món';
			return;
		}

		onSaved?.();
		onClose?.();
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 bg-black/40 p-4 sm:p-8"
		role="button"
		tabindex="0"
		aria-label="Đóng form món ăn"
		onclick={(event) => event.target === event.currentTarget && onClose?.()}
		onkeydown={(event) => (event.key === 'Escape' || event.key === 'Enter') && onClose?.()}
	>
		<div class="mx-auto max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-orange-200 bg-white p-5 shadow-xl">
			<div class="flex items-start justify-between gap-3">
				<h2 class="text-2xl font-semibold">{isEdit ? 'Chỉnh sửa món' : 'Thêm món mới'}</h2>
				<button class="rounded-lg border border-orange-200 px-3 py-1 text-sm" type="button" onclick={onClose}>Đóng</button>
			</div>

			<div class="mt-4 grid gap-3 sm:grid-cols-2">
				<label class="block text-sm sm:col-span-2">
					<span class="mb-1 block font-medium">Tên món</span>
					<input class="w-full rounded-xl border border-orange-200 px-3 py-2" bind:value={form.name} />
				</label>

				<label class="block text-sm">
					<span class="mb-1 block font-medium">Danh mục</span>
					<select class="w-full rounded-xl border border-orange-200 px-3 py-2" bind:value={form.categoryId}>
						{#each categories as category}
							<option value={category.id}>{category.name}</option>
						{/each}
					</select>
				</label>

				<label class="block text-sm">
					<span class="mb-1 block font-medium">Thứ tự hiển thị</span>
					<input class="w-full rounded-xl border border-orange-200 px-3 py-2" type="number" bind:value={form.sortOrder} />
				</label>

				<label class="block text-sm sm:col-span-2">
					<span class="mb-1 block font-medium">Mô tả</span>
					<textarea class="min-h-24 w-full rounded-xl border border-orange-200 px-3 py-2" bind:value={form.description}></textarea>
				</label>

				<label class="block text-sm sm:col-span-2">
					<span class="mb-1 block font-medium">Nguyên liệu</span>
					<textarea class="min-h-24 w-full rounded-xl border border-orange-200 px-3 py-2" bind:value={form.ingredients}></textarea>
				</label>

				<div class="block text-sm sm:col-span-2">
					<span class="mb-1 block font-medium">Thumbnail</span>
					<div class="rounded-xl border border-orange-200 bg-orange-50/40 p-3">
						<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
							<img
								src={form.thumbnailUrl || MENU_IMAGE}
								alt="Thumbnail preview"
								class="h-24 w-24 rounded-lg border border-orange-100 bg-white object-cover"
							/>
							<div class="flex-1 space-y-2">
								<div class="flex flex-wrap gap-2">
									<label class="btn-secondary cursor-pointer px-3 py-2 text-sm">
										<input class="hidden" type="file" accept="image/*" onchange={uploadThumbnailFile} />
										{uploading ? 'Đang upload...' : 'Upload thumbnail'}
									</label>
									<button class="btn-secondary px-3 py-2 text-sm" type="button" onclick={() => (form.thumbnailUrl = MENU_IMAGE)}>
										Dùng ảnh mặc định
									</button>
								</div>
								<p class="truncate text-xs text-slate-600">{form.thumbnailUrl || MENU_IMAGE}</p>
							</div>
						</div>
					</div>
				</div>

				<label class="inline-flex items-center gap-2 text-sm">
					<input type="checkbox" bind:checked={form.isTopping} />
					Là topping
				</label>
			</div>

			<section class="mt-5 rounded-xl border border-orange-100 bg-orange-50/60 p-4">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<h3 class="font-semibold">Hình ảnh / video</h3>
					<label class="btn-secondary cursor-pointer px-3 py-2 text-sm">
						<input class="hidden" type="file" accept="image/*,video/*" multiple onchange={uploadSelectedFiles} />
						{uploading ? 'Đang upload...' : 'Upload files'}
					</label>
				</div>

				{#if media.length === 0}
					<p class="mt-2 text-sm text-slate-600">Chưa có media. Có thể upload nhiều ảnh/video cùng lúc.</p>
				{:else}
					<div class="mt-3 grid gap-3 sm:grid-cols-2">
						{#each media as entry, index}
							<div class="rounded-xl border border-orange-200 bg-white p-2">
								{#if entry.type === 'image'}
									<img src={entry.url} alt="" class="h-28 w-full rounded-lg object-cover" />
								{:else}
									<div class="flex h-28 w-full items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-600">
										Video media
									</div>
								{/if}
								<p class="mt-2 truncate text-xs text-slate-600">{entry.url}</p>
								<div class="mt-2 flex gap-2">
									<button class="btn-secondary px-2 py-1 text-xs" type="button" onclick={() => setThumbnail(entry.url)}>
										Đặt làm thumbnail
									</button>
									<button class="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700" type="button" onclick={() => removeMedia(index)}>
										Xóa
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>

			<div class="mt-5 flex flex-wrap items-center justify-end gap-2">
				<button class="btn-secondary" type="button" onclick={onClose}>Hủy</button>
				<button class="btn-primary" type="button" onclick={submit} disabled={saving || uploading}>
					{saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo món'}
				</button>
			</div>

			{#if message}
				<p class="mt-3 rounded-lg bg-orange-50 px-3 py-2 text-sm text-slate-700">{message}</p>
			{/if}
		</div>
	</div>
{/if}
