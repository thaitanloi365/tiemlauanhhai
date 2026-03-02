<script lang="ts">
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
		<p class="mt-1 text-sm text-slate-600">Đổi mật khẩu cho tài khoản quản trị hiện tại.</p>
	</div>

	<section class="card-surface max-w-xl p-5">
		<h2 class="text-lg font-semibold">Đổi mật khẩu</h2>
		<div class="mt-4 space-y-3">
			<label class="block text-sm">
				<span class="mb-1 block font-medium">Mật khẩu hiện tại</span>
				<input
					class="w-full rounded-xl border border-orange-200 bg-white px-3 py-2"
					type="password"
					bind:value={currentPassword}
					placeholder="••••••••"
				/>
			</label>

			<label class="block text-sm">
				<span class="mb-1 block font-medium">Mật khẩu mới</span>
				<input
					class="w-full rounded-xl border border-orange-200 bg-white px-3 py-2"
					type="password"
					bind:value={newPassword}
					placeholder="Tối thiểu 8 ký tự"
				/>
			</label>

			<label class="block text-sm">
				<span class="mb-1 block font-medium">Xác nhận mật khẩu mới</span>
				<input
					class="w-full rounded-xl border border-orange-200 bg-white px-3 py-2"
					type="password"
					bind:value={confirmPassword}
					placeholder="Nhập lại mật khẩu mới"
					onkeydown={(event) => event.key === 'Enter' && !loading && changePassword()}
				/>
			</label>
		</div>

		{#if errorMessage}
			<p class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
		{/if}
		{#if successMessage}
			<p class="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{successMessage}</p>
		{/if}

		<button class="btn-primary mt-4" type="button" onclick={changePassword} disabled={loading}>
			{loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
		</button>
	</section>
</main>
