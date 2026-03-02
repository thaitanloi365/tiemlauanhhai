<script lang="ts">
	type Employee = {
		id: string;
		email: string;
		role: 'super_admin' | 'manager';
		display_name?: string | null;
	};

	type RoleOption = {
		value: 'super_admin' | 'manager';
		label: string;
	};

	let {
		open,
		mode,
		employee = null,
		roleOptions = [],
		onClose,
		onSaved
	} = $props<{
		open: boolean;
		mode: 'create' | 'edit';
		employee?: Employee | null;
		roleOptions?: RoleOption[];
		onClose?: () => void;
		onSaved?: () => void;
	}>();

	let email = $state('');
	let password = $state('');
	let role = $state<'super_admin' | 'manager'>('manager');
	let displayName = $state('');
	let saving = $state(false);
	let message = $state('');

	$effect(() => {
		if (!open) return;
		email = employee?.email ?? '';
		password = '';
		role = employee?.role ?? (roleOptions[0]?.value ?? 'manager');
		displayName = employee?.display_name ?? '';
		message = '';
	});

	async function save() {
		saving = true;
		message = '';

		const payload =
			mode === 'create'
				? { email, password, role, displayName: displayName || null }
				: { role, displayName: displayName || null };

		const endpoint = mode === 'create' ? '/api/admin/employees' : `/api/admin/employees/${employee?.id}`;
		const method = mode === 'create' ? 'POST' : 'PATCH';

		const res = await fetch(endpoint, {
			method,
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload)
		});
		const data = await res.json();
		saving = false;

		if (!res.ok) {
			message = data.message ?? 'Không thể lưu nhân viên';
			return;
		}

		onSaved?.();
		onClose?.();
	}
</script>

{#if open}
	<div class="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
		<div class="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">
			<div class="mb-4 flex items-center justify-between gap-3">
				<div>
					<p class="text-lg font-semibold">{mode === 'create' ? 'Thêm nhân viên' : 'Chỉnh sửa nhân viên'}</p>
					<p class="text-sm text-slate-500">
						{mode === 'create' ? 'Tạo tài khoản quản trị mới.' : 'Cập nhật vai trò hoặc tên hiển thị.'}
					</p>
				</div>
				<button type="button" class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm" onclick={onClose}>Đóng</button>
			</div>

			<div class="grid gap-3">
				<label class="block text-sm">
					<span class="mb-1 block font-medium">Email</span>
					<input
						class="w-full rounded-xl border border-orange-200 bg-white px-3 py-2"
						type="email"
						bind:value={email}
						disabled={mode === 'edit'}
						placeholder="employee@example.com"
					/>
				</label>

				{#if mode === 'create'}
					<label class="block text-sm">
						<span class="mb-1 block font-medium">Mật khẩu</span>
						<input
							class="w-full rounded-xl border border-orange-200 bg-white px-3 py-2"
							type="password"
							bind:value={password}
							placeholder="Tối thiểu 8 ký tự"
						/>
					</label>
				{/if}

				<label class="block text-sm">
					<span class="mb-1 block font-medium">Tên hiển thị</span>
					<input
						class="w-full rounded-xl border border-orange-200 bg-white px-3 py-2"
						type="text"
						bind:value={displayName}
						placeholder="Ví dụ: Quản lý ca sáng"
					/>
				</label>

				<label class="block text-sm">
					<span class="mb-1 block font-medium">Vai trò</span>
					<select class="w-full rounded-xl border border-orange-200 bg-white px-3 py-2" bind:value={role}>
						{#each roleOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</label>
			</div>

			{#if message}
				<p class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>
			{/if}

			<div class="mt-4 flex justify-end gap-2">
				<button type="button" class="btn-secondary px-4 py-2" onclick={onClose} disabled={saving}>Hủy</button>
				<button type="button" class="btn-primary px-4 py-2" onclick={save} disabled={saving}>
					{saving ? 'Đang lưu...' : 'Lưu'}
				</button>
			</div>
		</div>
	</div>
{/if}
