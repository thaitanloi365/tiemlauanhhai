<script lang="ts">
	import { MENU_IMAGE } from '$lib/constants/assets';
	import { formatCurrencyInput, parseCurrencyInput } from '$lib/utils/format';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';

	type CategoryOption = { id: string; name: string };
	type MediaEntry = { type: 'image' | 'video'; url: string; altText?: string | null };
	type MenuItemInput = {
		id?: string;
		name: string;
		category_id: string;
		description?: string | null;
		ingredients?: string | null;
		note?: string | null;
		preparation_time_minutes?: number | null;
		thumbnail_url?: string | null;
		is_topping?: boolean;
		sort_order?: number;
		media?: { type: 'image' | 'video'; url: string; alt_text?: string | null }[];
		variants?: {
			id?: string;
			name: string;
			price: number;
			serves_min?: number | null;
			serves_max?: number | null;
			is_default?: boolean;
		}[];
	};
	type VariantForm = {
		id?: string;
		name: string;
		price: string;
	};

	let { open = false, categories = [], item = null, onClose, onSaved } = $props<{
		open?: boolean;
		categories?: CategoryOption[];
		item?: MenuItemInput | null;
		onClose?: () => void;
		onSaved?: (savedItem?: any) => void;
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
		note: '',
		preparationTimeMinutes: '',
		thumbnailUrl: MENU_IMAGE,
		isTopping: false,
		sortOrder: 99
	});
	let media = $state<MediaEntry[]>([]);
	let variants = $state<VariantForm[]>([]);

	function createEmptyVariant(): VariantForm {
		return {
			name: '',
			price: ''
		};
	}

	function resetForm() {
		form.name = item?.name ?? '';
		form.categoryId = item?.category_id ?? categories[0]?.id ?? '';
		form.description = item?.description ?? '';
		form.ingredients = item?.ingredients ?? '';
		form.note = item?.note ?? '';
		form.preparationTimeMinutes =
			typeof item?.preparation_time_minutes === 'number' ? String(item.preparation_time_minutes) : '';
		form.thumbnailUrl = item?.thumbnail_url ?? MENU_IMAGE;
		form.isTopping = Boolean(item?.is_topping);
		form.sortOrder = item?.sort_order ?? 99;
		media =
			item?.media?.map((entry: { type: 'image' | 'video'; url: string; alt_text?: string | null }) => ({
				type: entry.type,
				url: entry.url,
				altText: entry.alt_text ?? null
			})) ?? [];
		const parsedVariants =
			item?.variants?.map((entry: { id?: string; name: string; price: number; serves_min?: number | null; serves_max?: number | null; is_default?: boolean }) => ({
				id: entry.id,
				name: entry.name ?? '',
				price: typeof entry.price === 'number' ? formatCurrencyInput(String(entry.price)) : ''
			})) ?? [];
		variants = parsedVariants.length > 0 ? parsedVariants : [createEmptyVariant()];
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

	function addVariant() {
		variants = [...variants, createEmptyVariant()];
	}

	function removeVariant(index: number) {
		const next = variants.filter((_, currentIndex) => currentIndex !== index);
		if (next.length === 0) {
			variants = [createEmptyVariant()];
			return;
		}
		variants = [...next];
	}

	function handleVariantPriceInput(index: number, event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		variants[index].price = formatCurrencyInput(input.value);
	}

	function handleVariantPriceChange(index: number) {
		variants[index].price = formatCurrencyInput(variants[index].price);
	}

	async function submit() {
		if (!form.name.trim() || !form.categoryId) {
			message = 'Vui lòng nhập tên món và chọn danh mục.';
			return;
		}

		saving = true;
		message = '';

		const normalizedVariants = variants.map((entry) => ({
			name: entry.name.trim(),
			price: parseCurrencyInput(entry.price)
		}));
		if (normalizedVariants.length === 0) {
			saving = false;
			message = 'Cần tối thiểu một biến thể giá.';
			return;
		}
		for (const entry of normalizedVariants) {
			if (!entry.name) {
				saving = false;
				message = 'Tên biến thể không được để trống.';
				return;
			}
			if (entry.price === null || !Number.isFinite(entry.price) || entry.price < 0) {
				saving = false;
				message = 'Giá biến thể không hợp lệ.';
				return;
			}
		}

		const payload = {
			name: form.name.trim(),
			categoryId: form.categoryId,
			description: form.description.trim() || null,
			ingredients: form.ingredients.trim() || null,
			note: form.note.trim() || null,
			preparationTimeMinutes:
				form.preparationTimeMinutes === '' ? null : Math.max(0, Number(form.preparationTimeMinutes || 0)),
			thumbnailUrl: form.thumbnailUrl.trim() || null,
			isTopping: form.isTopping,
			sortOrder: Number(form.sortOrder || 0),
			variants: normalizedVariants.map((entry, index) => ({
				name: entry.name,
				price: Math.round(entry.price as number),
				isDefault: index === 0
			})),
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

		onSaved?.(data.item);
		onClose?.();
	}
</script>

<Dialog.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose?.()}>
	<Dialog.Portal>
		<Dialog.Overlay />
		<Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
			<Dialog.Header>
				<Dialog.Title>{isEdit ? 'Chỉnh sửa món' : 'Thêm món mới'}</Dialog.Title>
			</Dialog.Header>

			<div class="mt-2 grid gap-4 sm:grid-cols-2">
				<div class="grid gap-2 sm:col-span-2">
					<Label for="menu-name">Tên món</Label>
					<Input id="menu-name" bind:value={form.name} />
				</div>

				<div class="grid gap-2">
					<Label for="menu-category">Danh mục</Label>
					<Select.Root type="single" bind:value={form.categoryId}>
						<Select.Trigger id="menu-category" class="w-full">
							{categories.find((category: CategoryOption) => category.id === form.categoryId)?.name ?? 'Chọn danh mục'}
						</Select.Trigger>
						<Select.Content>
							{#each categories as category}
								<Select.Item value={category.id} label={category.name}>{category.name}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<div class="grid gap-2">
					<Label for="menu-sort-order">Thứ tự hiển thị</Label>
					<Input id="menu-sort-order" type="number" bind:value={form.sortOrder} />
				</div>

				<div class="grid gap-2 sm:col-span-2">
					<Label for="menu-description">Mô tả</Label>
					<Textarea id="menu-description" class="min-h-24" bind:value={form.description} />
				</div>

				<div class="grid gap-2 sm:col-span-2">
					<Label for="menu-ingredients">Nguyên liệu</Label>
					<Textarea id="menu-ingredients" class="min-h-24" bind:value={form.ingredients} />
				</div>

				<div class="grid gap-2 sm:col-span-2">
					<Label for="menu-note">Note nhà hàng</Label>
					<Textarea
						id="menu-note"
						class="min-h-20"
						bind:value={form.note}
						placeholder="Ví dụ: Món cần 30-35 phút chuẩn bị khi quán đông."
					/>
				</div>

				<div class="grid gap-2">
					<Label for="menu-prep-time">Thời gian chuẩn bị (phút)</Label>
					<Input
						id="menu-prep-time"
						type="number"
						min="0"
						step="1"
						bind:value={form.preparationTimeMinutes}
						placeholder="Ví dụ: 30"
					/>
				</div>

				<div class="grid gap-2 sm:col-span-2">
					<Label>Thumbnail</Label>
					<div class="rounded-xl border bg-muted/40 p-3">
						<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
							<a
								href={form.thumbnailUrl || MENU_IMAGE}
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex w-fit"
								title="Mở ảnh ở tab mới"
							>
								<img
									src={form.thumbnailUrl || MENU_IMAGE}
									alt="Thumbnail preview"
									class="h-24 w-24 rounded-lg border bg-background object-cover"
								/>
							</a>
							<div class="flex-1 space-y-2">
								<div class="flex flex-wrap gap-2">
									<label class="inline-flex">
										<Button variant="outline" class="cursor-pointer" type="button">
											<input class="hidden" type="file" accept="image/*" onchange={uploadThumbnailFile} />
											{uploading ? 'Đang upload...' : 'Upload thumbnail'}
										</Button>
									</label>
									<Button variant="outline" type="button" onclick={() => (form.thumbnailUrl = MENU_IMAGE)}>
										Dùng ảnh mặc định
									</Button>
								</div>
								<p class="text-xs text-muted-foreground">Bấm vào ảnh để mở preview ở tab mới.</p>
							</div>
						</div>
					</div>
				</div>

				<div class="flex items-center gap-2">
					<Checkbox id="menu-is-topping" bind:checked={form.isTopping} />
					<Label for="menu-is-topping">Là topping</Label>
				</div>
			</div>

			<section class="mt-5 rounded-xl border bg-muted/40 p-4">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<h3 class="font-semibold">Biến thể giá</h3>
					<Button variant="outline" size="sm" type="button" onclick={addVariant}>Thêm biến thể</Button>
				</div>
				<div class="mt-3 space-y-3">
					{#each variants as variant, index}
						<div class="rounded-lg border bg-background p-3">
							<div class="grid gap-3 sm:grid-cols-2">
								<div class="grid gap-2">
									<Label for={`variant-name-${index}`}>Loại món</Label>
									<Input id={`variant-name-${index}`} bind:value={variant.name} placeholder="Ví dụ: Lẩu 2-3 người ăn" />
								</div>
								<div class="grid gap-2">
									<Label for={`variant-price-${index}`}>Giá (VND)</Label>
									<Input
										id={`variant-price-${index}`}
										type="text"
										inputmode="numeric"
										placeholder="Ví dụ: 120000"
										value={variant.price}
										oninput={(event) => handleVariantPriceInput(index, event)}
										onchange={() => handleVariantPriceChange(index)}
										onblur={() => handleVariantPriceChange(index)}
									/>
								</div>
							</div>
							<div class="mt-3 flex justify-end">
								<Button variant="destructive" size="sm" type="button" onclick={() => removeVariant(index)}>
									Xóa biến thể
								</Button>
							</div>
						</div>
					{/each}
				</div>
			</section>

			<section class="mt-5 rounded-xl border bg-muted/40 p-4">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<h3 class="font-semibold">Hình ảnh / video</h3>
					<label class="inline-flex">
						<Button variant="outline" class="cursor-pointer" type="button">
							<input class="hidden" type="file" accept="image/*,video/*" multiple onchange={uploadSelectedFiles} />
							{uploading ? 'Đang upload...' : 'Upload files'}
						</Button>
					</label>
				</div>

				{#if media.length === 0}
					<p class="mt-2 text-sm text-muted-foreground">Chưa có media. Có thể upload nhiều ảnh/video cùng lúc.</p>
				{:else}
					<div class="mt-3 grid gap-3 sm:grid-cols-2">
						{#each media as entry, index}
							<div class="rounded-xl border bg-background p-2">
								{#if entry.type === 'image'}
									<a href={entry.url} target="_blank" rel="noopener noreferrer" class="block" title="Mở ảnh ở tab mới">
										<img src={entry.url} alt="" class="h-28 w-full rounded-lg object-cover" />
									</a>
								{:else}
									<a
										href={entry.url}
										target="_blank"
										rel="noopener noreferrer"
										class="flex h-28 w-full items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground"
										title="Mở media ở tab mới"
									>
										Video media
									</a>
								{/if}
								<div class="mt-2 flex gap-2">
									<Button variant="outline" size="sm" type="button" onclick={() => setThumbnail(entry.url)}>
										Đặt làm thumbnail
									</Button>
									<Button variant="destructive" size="sm" type="button" onclick={() => removeMedia(index)}>
										Xóa
									</Button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>

			<Dialog.Footer class="mt-5">
				<Button variant="outline" type="button" onclick={onClose}>Hủy</Button>
				<Button type="button" onclick={submit} disabled={saving || uploading}>
					{saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo món'}
				</Button>
			</Dialog.Footer>

			{#if message}
				<p class="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</p>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
