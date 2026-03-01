<script lang="ts">
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

<div class="card-surface p-4">
	<div class="grid gap-2 sm:grid-cols-2">
		<label class="text-sm">
			<span class="mb-1 block font-medium">Mức giá</span>
			<select
				class="w-full rounded-xl border border-orange-200 bg-white px-3 py-2"
				value={selectedPrice}
				onchange={(event) => {
					const value = (event.currentTarget as HTMLSelectElement).value;
					const params = new URLSearchParams(location.search);
					if (value) params.set('price', value);
					else params.delete('price');
					location.href = `/menu?${params.toString()}`;
				}}
			>
				{#each priceRanges as price}
					<option value={price.value}>{price.label}</option>
				{/each}
			</select>
		</label>
		<label class="text-sm">
			<span class="mb-1 block font-medium">Sắp xếp</span>
			<select
				class="w-full rounded-xl border border-orange-200 bg-white px-3 py-2"
				value={selectedSort}
				onchange={(event) => {
					const value = (event.currentTarget as HTMLSelectElement).value;
					const params = new URLSearchParams(location.search);
					if (value) params.set('sort', value);
					else params.delete('sort');
					location.href = `/menu?${params.toString()}`;
				}}
			>
				<option value="popular">Phổ biến</option>
				<option value="price_asc">Giá thấp đến cao</option>
				<option value="price_desc">Giá cao đến thấp</option>
			</select>
		</label>
	</div>
</div>
