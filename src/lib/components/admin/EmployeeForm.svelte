<script lang="ts">
	import { isStrongPassword, strongPasswordGuideline } from '$lib/utils/password-policy';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Alert, AlertDescription } from '$lib/components/ui/alert/index.js';

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

		if (mode === 'create' && !isStrongPassword(password)) {
			saving = false;
			message = strongPasswordGuideline;
			return;
		}

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

<Dialog.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose?.()}>
	<Dialog.Portal>
		<Dialog.Overlay />
		<Dialog.Content class="sm:max-w-xl">
			<Dialog.Header>
				<Dialog.Title>{mode === 'create' ? 'Thêm nhân viên' : 'Chỉnh sửa nhân viên'}</Dialog.Title>
				<Dialog.Description>
					{mode === 'create' ? 'Tạo tài khoản quản trị mới.' : 'Cập nhật vai trò hoặc tên hiển thị.'}
				</Dialog.Description>
			</Dialog.Header>

			<div class="grid gap-4 py-2">
				<div class="grid gap-2">
					<Label for="employee-email">Email</Label>
					<Input
						id="employee-email"
						type="email"
						bind:value={email}
						disabled={mode === 'edit'}
						placeholder="employee@example.com"
					/>
				</div>

				{#if mode === 'create'}
					<div class="grid gap-2">
						<Label for="employee-password">Mật khẩu</Label>
						<Input
							id="employee-password"
							type="password"
							bind:value={password}
							placeholder="Tối thiểu 8 ký tự"
						/>
						<p class="text-xs text-muted-foreground">{strongPasswordGuideline}</p>
					</div>
				{/if}

				<div class="grid gap-2">
					<Label for="employee-display-name">Tên hiển thị</Label>
					<Input
						id="employee-display-name"
						type="text"
						bind:value={displayName}
						placeholder="Ví dụ: Quản lý ca sáng"
					/>
				</div>

				<div class="grid gap-2">
					<Label for="employee-role">Vai trò</Label>
					<Select.Root type="single" bind:value={role}>
						<Select.Trigger id="employee-role" class="w-full">
							{#if role}
								{roleOptions.find((option: RoleOption) => option.value === role)?.label ?? role}
							{:else}
								Chọn vai trò
							{/if}
						</Select.Trigger>
						<Select.Content>
							{#each roleOptions as option}
								<Select.Item value={option.value} label={option.label}>{option.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			</div>

			{#if message}
				<Alert variant="destructive">
					<AlertDescription>{message}</AlertDescription>
				</Alert>
			{/if}

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={onClose} disabled={saving}>Hủy</Button>
				<Button type="button" onclick={save} disabled={saving}>
					{saving ? 'Đang lưu...' : 'Lưu'}
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
