<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Select from '$lib/components/ui/select/index.js';

	let { selectedPrice = '', selectedSort = 'popular' } = $props<{
		selectedPrice?: string;
		selectedSort?: string;
	}>();

	const priceRanges = [
		{ value: '', label: 'Tất cả mức giá' },
		{ value: 'lt50', label: 'Dưới 50.000đ' },
		{ value: '50to100', label: '50.000đ - 100.000đ' },
		{ value: '100to200', label: '100.000đ - 200.000đ' },
		{ value: 'gt200', label: 'Trên 200.000đ' }
	];
</script>

<Card.Root>
	<Card.Content class="p-4">
	<div class="grid gap-2 sm:grid-cols-2">
		<div class="text-sm">
			<span class="mb-1 block font-medium">Mức giá</span>
			<Select.Root
				type="single"
				value={selectedPrice}
				onValueChange={(value: string) => {
					const params = new URLSearchParams(location.search);
					if (value) params.set('price', value);
					else params.delete('price');
					location.href = `/menu?${params.toString()}`;
				}}
			>
				<Select.Trigger class="w-full">
					{priceRanges.find((price) => price.value === selectedPrice)?.label ?? 'Tất cả mức giá'}
				</Select.Trigger>
				<Select.Content>
					{#each priceRanges as price}
						<Select.Item value={price.value} label={price.label}>{price.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
		<div class="text-sm">
			<span class="mb-1 block font-medium">Sắp xếp</span>
			<Select.Root
				type="single"
				value={selectedSort}
				onValueChange={(value: string) => {
					const params = new URLSearchParams(location.search);
					if (value) params.set('sort', value);
					else params.delete('sort');
					location.href = `/menu?${params.toString()}`;
				}}
			>
				<Select.Trigger class="w-full">
					{selectedSort === 'price_asc' ? 'Giá thấp đến cao' : selectedSort === 'price_desc' ? 'Giá cao đến thấp' : 'Phổ biến'}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="popular" label="Phổ biến">Phổ biến</Select.Item>
					<Select.Item value="price_asc" label="Giá thấp đến cao">Giá thấp đến cao</Select.Item>
					<Select.Item value="price_desc" label="Giá cao đến thấp">Giá cao đến thấp</Select.Item>
				</Select.Content>
			</Select.Root>
		</div>
	</div>
	</Card.Content>
</Card.Root>
