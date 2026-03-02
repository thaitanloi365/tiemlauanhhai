<script lang="ts">
	import { Command as CommandPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let { class: className, ...restProps }: CommandPrimitive.RootProps = $props();
</script>

<CommandPrimitive.Root
	data-slot="command"
	class={cn(
		"bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md",
		className
	)}
	{...restProps}
/>
