<script lang="ts">
	import { formatCurrency, statusClass, statusLabel } from '$lib/utils/format';
	import { createQuery } from '@tanstack/svelte-query';
	import { createRawSnippet } from 'svelte';
	import {
		type ColumnDef,
		type ColumnFiltersState,
		type PaginationState,
		type SortingState,
		getCoreRowModel,
		getFilteredRowModel,
		getPaginationRowModel,
		getSortedRowModel
	} from '@tanstack/table-core';
	import { createSvelteTable, FlexRender, renderSnippet } from '$lib/components/ui/data-table/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Table from '$lib/components/ui/table/index.js';

	type AdminOrder = {
		id: string;
		customer_name: string;
		phone: string;
		total_amount: number;
		status: string;
		created_at: string;
	};

	let submittedStatus = $state('');
	let submittedQuery = $state('');
	let status = $state('');
	let q = $state('');

	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });
	let sorting = $state<SortingState>([]);
	let columnFilters = $state<ColumnFiltersState>([]);

	const statusFilterOptions = [
		{ label: 'Tất cả trạng thái', value: '' },
		{ label: 'Chờ xác nhận', value: 'pending' },
		{ label: 'Đã xác nhận', value: 'confirmed' },
		{ label: 'Đang chuẩn bị', value: 'preparing' },
		{ label: 'Đang giao', value: 'shipping' },
		{ label: 'Đã giao', value: 'delivered' },
		{ label: 'Đã hủy', value: 'cancelled' }
	];

	const ordersQuery = createQuery(() => ({
		queryKey: ['admin', 'orders', submittedStatus, submittedQuery],
		queryFn: async () => {
			const params = new URLSearchParams();
			if (submittedStatus) params.set('status', submittedStatus);
			if (submittedQuery) params.set('q', submittedQuery);
			const res = await fetch(`/api/admin/orders?${params.toString()}`);
			const data = await res.json();
			if (!res.ok) throw new Error(data.message ?? 'Không tải được danh sách đơn');
			return (data.orders ?? []) as AdminOrder[];
		}
	}));

	const orders = $derived(ordersQuery.data ?? []);

	const columns: ColumnDef<AdminOrder>[] = [
		{
			accessorKey: 'id',
			header: 'Mã',
			cell: ({ row }) => {
				const idSnippet = createRawSnippet<[{ id: string }]>((getId) => {
					const { id } = getId();
					return {
						render: () => `<a class="text-primary underline" href="/admin/orders/${id}">${id.slice(0, 8)}</a>`
					};
				});
				return renderSnippet(idSnippet, { id: row.original.id });
			}
		},
		{
			id: 'customer',
			header: 'Khách',
			cell: ({ row }) => `${row.original.customer_name}\n${row.original.phone}`
		},
		{
			accessorKey: 'total_amount',
			header: 'Tổng',
			cell: ({ row }) => formatCurrency(row.original.total_amount)
		},
		{
			accessorKey: 'status',
			header: 'Trạng thái',
			cell: ({ row }) => {
				const statusSnippet = createRawSnippet<[{ label: string; className: string }]>((getStatus) => {
					const { label, className } = getStatus();
					return {
						render: () => `<span class="rounded-full px-2 py-1 text-xs font-medium ${className}">${label}</span>`
					};
				});
				return renderSnippet(statusSnippet, {
					label: statusLabel(row.original.status),
					className: statusClass(row.original.status)
				});
			}
		},
		{
			accessorKey: 'created_at',
			header: 'Ngày đặt',
			cell: ({ row }) => new Date(row.original.created_at).toLocaleString('vi-VN')
		}
	];

	const table = createSvelteTable({
		get data() {
			return orders;
		},
		columns,
		state: {
			get pagination() {
				return pagination;
			},
			get sorting() {
				return sorting;
			},
			get columnFilters() {
				return columnFilters;
			}
		},
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onPaginationChange: (updater) => {
			pagination = typeof updater === 'function' ? updater(pagination) : updater;
		},
		onSortingChange: (updater) => {
			sorting = typeof updater === 'function' ? updater(sorting) : updater;
		},
		onColumnFiltersChange: (updater) => {
			columnFilters = typeof updater === 'function' ? updater(columnFilters) : updater;
		}
	});

	function applyFilter() {
		submittedStatus = status;
		submittedQuery = q.trim();
		pagination = { ...pagination, pageIndex: 0 };
	}
</script>

<main class="container-shell space-y-4">
	<div class="flex flex-wrap items-end justify-between gap-3">
		<h1 class="text-3xl font-bold">Quản lý đơn hàng</h1>
		<div class="flex flex-wrap gap-2">
			<Select.Root type="single" bind:value={status}>
				<Select.Trigger class="w-[220px]">
					{statusFilterOptions.find((option) => option.value === status)?.label ?? 'Tất cả trạng thái'}
				</Select.Trigger>
				<Select.Content>
					{#each statusFilterOptions as option}
						<Select.Item value={option.value} label={option.label}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<Input
				class="w-[220px]"
				bind:value={q}
				placeholder="Tìm tên / SĐT"
				onkeydown={(event) => event.key === 'Enter' && applyFilter()}
			/>
			<Button type="button" variant="outline" onclick={applyFilter}>Lọc</Button>
		</div>
	</div>

	{#if ordersQuery.isPending}
		<div class="rounded-md border p-4 text-sm text-muted-foreground">Đang tải dữ liệu...</div>
	{:else if ordersQuery.isError}
		<div class="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
			{ordersQuery.error?.message ?? 'Không tải được danh sách đơn hàng'}
		</div>
	{:else if orders.length === 0}
		<div class="rounded-md border p-6 text-center">
			<p class="text-base font-medium">Chưa có đơn hàng nào</p>
			<p class="mt-1 text-sm text-muted-foreground">Không có dữ liệu phù hợp với bộ lọc hiện tại.</p>
		</div>
	{:else}
		<div class="rounded-md border">
			<Table.Root>
				<Table.Header>
					{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
						<Table.Row>
							{#each headerGroup.headers as header (header.id)}
								<Table.Head>
									{#if !header.isPlaceholder}
										<FlexRender content={header.column.columnDef.header} context={header.getContext()} />
									{/if}
								</Table.Head>
							{/each}
						</Table.Row>
					{/each}
				</Table.Header>
				<Table.Body>
					{#each table.getRowModel().rows as row (row.id)}
						<Table.Row>
							{#each row.getVisibleCells() as cell (cell.id)}
								<Table.Cell class="align-top whitespace-pre-line">
									<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
								</Table.Cell>
							{/each}
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell colspan={columns.length} class="h-20 text-center">Không có dữ liệu.</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
		<div class="flex items-center justify-end gap-2">
			<Button variant="outline" size="sm" onclick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
				Previous
			</Button>
			<Button variant="outline" size="sm" onclick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
				Next
			</Button>
		</div>
	{/if}
</main>
