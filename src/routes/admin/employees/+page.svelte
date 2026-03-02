<script lang="ts">
	import { onMount } from 'svelte';
	import EmployeeForm from '$lib/components/admin/EmployeeForm.svelte';

	let { data } = $props();

	type Employee = {
		id: string;
		email: string;
		role: 'super_admin' | 'manager';
		display_name?: string | null;
		created_at: string;
	};

	let loading = $state(true);
	let message = $state('');
	let employees = $state<Employee[]>([]);
	let savingId = $state<string | null>(null);
	let showForm = $state(false);
	let formMode = $state<'create' | 'edit'>('create');
	let selectedEmployee = $state<Employee | null>(null);
	const allRoleOptions: { value: Employee['role']; label: string }[] = [
		{ value: 'super_admin', label: 'Super Admin' },
		{ value: 'manager', label: 'Manager' }
	];

	const roleOptions = $derived(
		data.adminUser?.role === 'super_admin'
			? allRoleOptions
			: allRoleOptions.filter((option) => option.value === 'manager')
	);

	async function loadEmployees() {
		loading = true;
		const res = await fetch('/api/admin/employees');
		const result = await res.json();
		if (!res.ok) {
			message = result.message ?? 'Không thể tải danh sách nhân viên';
			loading = false;
			return;
		}
		employees = result.employees ?? [];
		message = '';
		loading = false;
	}

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
		await loadEmployees();
	}

	function roleLabel(role: Employee['role']) {
		return role === 'super_admin' ? 'Super Admin' : 'Manager';
	}

	onMount(() => {
		loadEmployees();
	});
</script>

<main class="container-shell space-y-4">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="text-3xl font-bold">Quản lý nhân viên</h1>
			<p class="mt-1 text-sm text-slate-600">Quản lý danh sách tài khoản admin và phân quyền vai trò.</p>
		</div>
		<button class="btn-primary" type="button" onclick={openCreate}>Thêm nhân viên</button>
	</div>

	{#if message}
		<p class="rounded-lg bg-orange-100 px-3 py-2 text-sm text-orange-900">{message}</p>
	{/if}

	{#if loading}
		<div class="card-surface animate-pulse p-4">
			<div class="space-y-2">
				{#each Array.from({ length: 6 }) as _, index (`employee-row-skeleton-${index}`)}
					<div class="grid grid-cols-4 gap-2 rounded-lg bg-white p-3">
						<div class="h-3 rounded bg-orange-100"></div>
						<div class="h-3 rounded bg-orange-100"></div>
						<div class="h-3 rounded bg-orange-100"></div>
						<div class="h-3 rounded bg-orange-100"></div>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="overflow-x-auto rounded-2xl border border-orange-100 bg-white">
			<table class="min-w-full text-left text-sm">
				<thead class="bg-orange-50 text-slate-700">
					<tr>
						<th class="px-4 py-3">Email</th>
						<th class="px-4 py-3">Tên hiển thị</th>
						<th class="px-4 py-3">Vai trò</th>
						<th class="px-4 py-3">Ngày tạo</th>
						<th class="px-4 py-3 text-right">Thao tác</th>
					</tr>
				</thead>
				<tbody>
					{#if employees.length === 0}
						<tr class="border-t border-orange-100">
							<td colspan="5" class="px-4 py-8 text-center text-slate-500">Chưa có nhân viên nào.</td>
						</tr>
					{:else}
						{#each employees as employee}
							<tr class="border-t border-orange-100 hover:bg-orange-50/40">
								<td class="px-4 py-3">{employee.email}</td>
								<td class="px-4 py-3">{employee.display_name || '-'}</td>
								<td class="px-4 py-3">
									<span class={`rounded-full px-2 py-1 text-xs font-medium ${employee.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
										{roleLabel(employee.role)}
									</span>
								</td>
								<td class="px-4 py-3">{new Date(employee.created_at).toLocaleString('vi-VN')}</td>
								<td class="px-4 py-3">
									<div class="flex justify-end gap-2">
										<button class="btn-secondary px-3 py-2 text-xs" type="button" onclick={() => openEdit(employee)}>
											Sửa
										</button>
										<button
											class="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
											type="button"
											disabled={savingId === employee.id || employee.id === data.adminUser?.id}
											onclick={() => removeEmployee(employee)}
										>
											{savingId === employee.id ? 'Đang xóa...' : 'Xóa'}
										</button>
									</div>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	{/if}
</main>

<EmployeeForm
	open={showForm}
	mode={formMode}
	employee={selectedEmployee}
	roleOptions={roleOptions}
	onClose={() => (showForm = false)}
	onSaved={loadEmployees}
/>
