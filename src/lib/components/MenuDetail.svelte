<script lang="ts">
	import type { MenuItem } from '$lib/types';
	import { formatCurrency } from '$lib/utils/format';

	let { item } = $props<{ item: MenuItem }>();
</script>

<article class="card-surface p-4">
	<h2 class="text-2xl font-semibold">{item.name}</h2>
	<p class="mt-2 text-slate-700">{item.description}</p>
	<p class="mt-3 text-sm font-medium text-orange-700">
		{formatCurrency(Math.min(...item.variants.map((entry: { price: number }) => entry.price)))}
	</p>
</article>
