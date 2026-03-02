<script lang="ts">
	import { Command as CommandPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let { class: className, ...restProps }: CommandPrimitive.ListProps = $props();
</script>

<CommandPrimitive.List
	data-slot="command-list"
	class={cn("max-h-72 overflow-y-auto overflow-x-hidden", className)}
	{...restProps}
/>
