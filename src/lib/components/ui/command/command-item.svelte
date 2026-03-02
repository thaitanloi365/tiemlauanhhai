<script lang="ts">
	import { Command as CommandPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let { class: className, ...restProps }: CommandPrimitive.ItemProps = $props();
</script>

<CommandPrimitive.Item
	data-slot="command-item"
	class={cn(
		"relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[selected]:bg-accent data-[selected]:text-accent-foreground",
		className
	)}
	{...restProps}
/>
