<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';

let email = $state('');
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
	<Card.Root class="w-full max-w-md">
		<Card.Header>
			<Card.Title>Admin Login</Card.Title>
			<Card.Description>Chỉ tài khoản admin hợp lệ mới truy cập được trang quản trị.</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="grid gap-2">
				<Label for="admin-email">Email</Label>
				<Input id="admin-email" type="email" bind:value={email} placeholder="you@example.com" />
			</div>
			<div class="grid gap-2">
				<Label for="admin-password">Mật khẩu</Label>
				<Input
					id="admin-password"
					type="password"
					bind:value={password}
					placeholder="••••••••"
					onkeydown={(event) => event.key === 'Enter' && !loading && login()}
				/>
			</div>
			{#if message}
				<p class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</p>
			{/if}
		</Card.Content>
		<Card.Footer>
			<Button class="w-full" type="button" onclick={login} disabled={loading}>
				{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
			</Button>
		</Card.Footer>
	</Card.Root>
</main>
