<script lang="ts">
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import {
		type ColumnDef,
		type PaginationState,
		getCoreRowModel,
		getPaginationRowModel
	} from '@tanstack/table-core';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table/index.js';
	import EmployeeForm from '$lib/components/admin/EmployeeForm.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Table from '$lib/components/ui/table/index.js';

	let { data } = $props();
	const queryClient = useQueryClient();

	type Employee = {
		id: string;
		email: string;
		role: 'super_admin' | 'manager';
		display_name?: string | null;
		created_at: string;
	};

	let message = $state('');
	let savingId = $state<string | null>(null);
	let showForm = $state(false);
	let formMode = $state<'create' | 'edit'>('create');
	let selectedEmployee = $state<Employee | null>(null);
	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const allRoleOptions: { value: Employee['role']; label: string }[] = [
		{ value: 'super_admin', label: 'Super Admin' },
		{ value: 'manager', label: 'Manager' }
	];

	const roleOptions = $derived(
		data.adminUser?.role === 'super_admin'
			? allRoleOptions
			: allRoleOptions.filter((option) => option.value === 'manager')
	);

	const employeesQuery = createQuery(() => ({
		queryKey: ['admin', 'employees'],
		queryFn: async () => {
			const res = await fetch('/api/admin/employees');
			const result = await res.json();
			if (!res.ok) throw new Error(result.message ?? 'Không thể tải danh sách nhân viên');
			return (result.employees ?? []) as Employee[];
		}
	}));

	const employees = $derived(employeesQuery.data ?? []);

	function openCreate() {
		formMode = 'create';
		selectedEmployee = null;
		showForm = true;
	}

	function openEdit(employee: Employee) {
		formMode = 'edit';
		selectedEmployee = employee;
		showForm = true;
	}

	async function removeEmployee(employee: Employee) {
		if (!confirm(`Xóa nhân viên ${employee.email}?`)) return;
		savingId = employee.id;
		const res = await fetch(`/api/admin/employees/${employee.id}`, { method: 'DELETE' });
		const result = await res.json();
		savingId = null;
		if (!res.ok) {
			message = result.message ?? 'Không thể xóa nhân viên';
			return;
		}
		message = '';
		await queryClient.invalidateQueries({ queryKey: ['admin', 'employees'] });
	}

	function roleLabel(role: Employee['role']) {
		return role === 'super_admin' ? 'Super Admin' : 'Manager';
	}

	const columns: ColumnDef<Employee>[] = [
		{ accessorKey: 'email', header: 'Email' },
		{
			id: 'display_name',
			header: 'Tên hiển thị',
			cell: ({ row }) => row.original.display_name || '-'
		},
		{
			accessorKey: 'role',
			header: 'Vai trò',
			cell: ({ row }) => roleLabel(row.original.role)
		},
		{
			accessorKey: 'created_at',
			header: 'Ngày tạo',
			cell: ({ row }) => new Date(row.original.created_at).toLocaleString('vi-VN')
		},
		{
			id: 'actions',
			header: 'Thao tác',
			cell: ({ row }) => row.original.id
		}
	];

	const table = createSvelteTable({
		get data() {
			return employees;
		},
		columns,
		state: {
			get pagination() {
				return pagination;
			}
		},
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onPaginationChange: (updater) => {
			pagination = typeof updater === 'function' ? updater(pagination) : updater;
		}
	});
</script>

<main class="container-shell space-y-4">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="text-3xl font-bold">Quản lý nhân viên</h1>
			<p class="mt-1 text-sm text-slate-600">Quản lý danh sách tài khoản admin và phân quyền vai trò.</p>
		</div>
		<Button type="button" onclick={openCreate}>Thêm nhân viên</Button>
	</div>

	{#if message}
		<p class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</p>
	{/if}

	{#if employeesQuery.isPending}
		<div class="rounded-md border p-4 text-sm text-muted-foreground">Đang tải dữ liệu...</div>
	{:else if employeesQuery.isError}
		<div class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
			{employeesQuery.error?.message ?? 'Không thể tải danh sách nhân viên'}
		</div>
	{:else}
		<div class="rounded-md border">
			<Table.Root>
				<Table.Header>
					{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
						<Table.Row>
							{#each headerGroup.headers as header (header.id)}
								<Table.Head>{#if !header.isPlaceholder}<FlexRender content={header.column.columnDef.header} context={header.getContext()} />{/if}</Table.Head>
							{/each}
						</Table.Row>
					{/each}
				</Table.Header>
				<Table.Body>
					{#each table.getRowModel().rows as row (row.id)}
						<Table.Row>
							{#each row.getVisibleCells() as cell (cell.id)}
								{#if cell.column.id === 'role'}
									<Table.Cell>
										<Badge variant="secondary">{roleLabel(row.original.role)}</Badge>
									</Table.Cell>
								{:else if cell.column.id === 'actions'}
									<Table.Cell>
										<div class="flex justify-end gap-2">
											<Button variant="outline" size="sm" type="button" onclick={() => openEdit(row.original)}>Sửa</Button>
											<Button
												variant="destructive"
												size="sm"
												type="button"
												disabled={savingId === row.original.id || row.original.id === data.adminUser?.id}
												onclick={() => removeEmployee(row.original)}
											>
												{savingId === row.original.id ? 'Đang xóa...' : 'Xóa'}
											</Button>
										</div>
									</Table.Cell>
								{:else}
									<Table.Cell>
										<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
									</Table.Cell>
								{/if}
							{/each}
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell colspan={columns.length} class="h-20 text-center text-muted-foreground">Chưa có nhân viên nào.</Table.Cell>
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

<EmployeeForm
	open={showForm}
	mode={formMode}
	employee={selectedEmployee}
	roleOptions={roleOptions}
	onClose={() => (showForm = false)}
	onSaved={() => queryClient.invalidateQueries({ queryKey: ['admin', 'employees'] })}
/>
