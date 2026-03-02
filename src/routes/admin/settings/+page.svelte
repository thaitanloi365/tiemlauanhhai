<script lang="ts">
	import { isStrongPassword, strongPasswordGuideline } from '$lib/utils/password-policy';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	async function changePassword() {
		errorMessage = '';
		successMessage = '';

		if (!currentPassword || !newPassword || !confirmPassword) {
			errorMessage = 'Vui lòng nhập đầy đủ thông tin.';
			return;
		}
		if (newPassword !== confirmPassword) {
			errorMessage = 'Mật khẩu xác nhận không khớp.';
			return;
		}
		if (!isStrongPassword(newPassword)) {
			errorMessage = strongPasswordGuideline;
			return;
		}
		if (newPassword === currentPassword) {
			errorMessage = 'Mật khẩu mới phải khác mật khẩu hiện tại.';
			return;
		}

		loading = true;
		const res = await fetch('/api/admin/auth/change-password', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				currentPassword,
				newPassword
			})
		});
		const data = await res.json();
		loading = false;

		if (!res.ok) {
			errorMessage = data.message ?? 'Không thể đổi mật khẩu';
			return;
		}

		successMessage = 'Đổi mật khẩu thành công.';
		currentPassword = '';
		newPassword = '';
		confirmPassword = '';
	}
</script>

<main class="container-shell space-y-4">
	<div>
		<h1 class="text-3xl font-bold">Cài đặt tài khoản</h1>
		<p class="mt-1 text-sm text-muted-foreground">Đổi mật khẩu cho tài khoản quản trị hiện tại.</p>
	</div>

	<Card.Root class="max-w-xl">
		<Card.Header>
			<Card.Title>Đổi mật khẩu</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="grid gap-2">
				<Label for="current-password">Mật khẩu hiện tại</Label>
				<Input id="current-password" type="password" bind:value={currentPassword} placeholder="••••••••" />
			</div>

			<div class="grid gap-2">
				<Label for="new-password">Mật khẩu mới</Label>
				<Input id="new-password" type="password" bind:value={newPassword} placeholder="Tối thiểu 8 ký tự" />
				<p class="text-xs text-muted-foreground">{strongPasswordGuideline}</p>
			</div>

			<div class="grid gap-2">
				<Label for="confirm-password">Xác nhận mật khẩu mới</Label>
				<Input
					id="confirm-password"
					type="password"
					bind:value={confirmPassword}
					placeholder="Nhập lại mật khẩu mới"
					onkeydown={(event) => event.key === 'Enter' && !loading && changePassword()}
				/>
			</div>

			{#if errorMessage}
				<p class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorMessage}</p>
			{/if}
			{#if successMessage}
				<p class="rounded-md border border-emerald-300/70 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{successMessage}</p>
			{/if}
		</Card.Content>
		<Card.Footer>
			<Button type="button" onclick={changePassword} disabled={loading}>
				{loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
			</Button>
		</Card.Footer>
	</Card.Root>
</main>
