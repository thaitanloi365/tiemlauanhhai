<script lang="ts">
	import { goto } from '$app/navigation';

	let email = $state('thaitanloi365@gmail.com');
	let password = $state('');
	let loading = $state(false);
	let message = $state('');

	async function login() {
		loading = true;
		message = '';

		const res = await fetch('/api/admin/auth/login', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ email, password })
		});

		const data = await res.json();
		loading = false;

		if (!res.ok) {
			message = data.message ?? 'Không đăng nhập được';
			return;
		}

		await goto('/admin');
	}
</script>

<main class="container-shell flex min-h-dvh items-center justify-center py-10">
	<section class="card-surface w-full max-w-md p-6">
		<h1 class="text-3xl font-bold">Admin Login</h1>
		<p class="mt-2 text-sm text-slate-600">Chỉ tài khoản admin hợp lệ mới truy cập được trang quản trị.</p>

		<div class="mt-5 space-y-3">
			<label class="block text-sm">
				<span class="mb-1 block font-medium">Email</span>
				<input
					class="w-full rounded-xl border border-orange-200 bg-white px-3 py-2"
					type="email"
					bind:value={email}
					placeholder="you@example.com"
				/>
			</label>

			<label class="block text-sm">
				<span class="mb-1 block font-medium">Mật khẩu</span>
				<input
					class="w-full rounded-xl border border-orange-200 bg-white px-3 py-2"
					type="password"
					bind:value={password}
					placeholder="••••••••"
					onkeydown={(event) => event.key === 'Enter' && !loading && login()}
				/>
			</label>
		</div>

		<button class="btn-primary mt-5 w-full" type="button" onclick={login} disabled={loading}>
			{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
		</button>

		{#if message}
			<p class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>
		{/if}
	</section>
</main>
