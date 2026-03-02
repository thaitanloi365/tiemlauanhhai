<script lang="ts">
	import CheckIcon from "@lucide/svelte/icons/check";
	import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
	import { Popover } from "bits-ui";
	import * as Command from "$lib/components/ui/command/index.js";
	import { cn } from "$lib/utils.js";

	export type SelectSearchOption = {
		value: string;
		label: string;
		keywords?: string[];
	};

	let {
		value = $bindable(""),
		options = [],
		placeholder = "Chọn mục",
		searchPlaceholder = "Tìm kiếm...",
		emptyText = "Không tìm thấy kết quả phù hợp.",
		name = "",
		disabled = false,
		class: className = "",
	} = $props<{
		value?: string;
		options?: SelectSearchOption[];
		placeholder?: string;
		searchPlaceholder?: string;
		emptyText?: string;
		name?: string;
		disabled?: boolean;
		class?: string;
	}>();

	let open = $state(false);

	const selectedLabel = $derived(
		options.find((option: SelectSearchOption) => option.value === value)?.label ?? placeholder
	);

	function selectOption(nextValue: string) {
		value = nextValue;
		open = false;
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		name={name || undefined}
		data-field-name={name || undefined}
		type="button"
		class={cn(
			"border-input data-placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none select-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
			"data-[state=open]:ring-ring/50 data-[state=open]:ring-[3px]",
			className
		)}
		{disabled}
	>
		<span class={cn("truncate", !value && "text-muted-foreground")}>{selectedLabel}</span>
		<ChevronsUpDownIcon class="size-4 shrink-0 opacity-50" />
	</Popover.Trigger>
	<Popover.Portal>
		<Popover.Content
			class="bg-popover text-popover-foreground z-50 w-(--bits-popover-anchor-width) rounded-md border p-0 shadow-md outline-hidden"
			sideOffset={4}
		>
			<Command.Root label="Searchable select options">
				<Command.Input placeholder={searchPlaceholder} />
				<Command.List>
					<Command.Empty>{emptyText}</Command.Empty>
					{#each options as option}
						<Command.Item
							value={option.label}
							keywords={option.keywords}
							onSelect={() => selectOption(option.value)}
						>
							<CheckIcon
								class={cn("mr-1 size-4", value === option.value ? "opacity-100" : "opacity-0")}
							/>
							{option.label}
						</Command.Item>
					{/each}
				</Command.List>
			</Command.Root>
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>
