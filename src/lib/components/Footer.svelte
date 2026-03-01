<script lang="ts">
	import { LOGO_IMAGE } from '$lib/constants/assets';
</script>

<footer class="mt-16 border-t border-orange-200 bg-orange-50 pb-20 pt-10 md:pb-10">
	<div class="container-shell grid gap-8 md:grid-cols-3">
		<div class="space-y-3">
			<div class="flex items-center gap-3">
				<img src={LOGO_IMAGE} alt="Logo Tiệm Lẩu Anh Hai" class="size-10 rounded-md object-contain" />
				<div>
					<p class="text-sm text-orange-800">Tiệm Lẩu</p>
					<p class="font-semibold">Anh Hai</p>
				</div>
			</div>
			<p class="text-sm text-slate-700">Hương vị miền Tây, đậm đà tại nhà.</p>
		</div>
		<div class="space-y-2 text-sm text-slate-700">
			<p class="font-semibold text-slate-900">Thông tin quán</p>
			<p>Địa chỉ: Cập nhật sau</p>
			<p>Giờ mở cửa: 10:00 - 22:00</p>
			<p>Hotline: 0900 000 000</p>
		</div>
		<div class="space-y-2 text-sm text-slate-700">
			<p class="font-semibold text-slate-900">Kết nối</p>
			<div class="flex gap-4">
				<a
					href="https://facebook.com"
					target="_blank"
					rel="noreferrer"
					aria-label="Facebook"
					class="inline-flex size-10 items-center justify-center rounded-full border border-orange-200 bg-white text-orange-700 transition hover:bg-orange-100"
				>
					<svg viewBox="0 0 24 24" class="size-5" fill="currentColor" aria-hidden="true">
						<path d="M13.5 21v-7h2.3l.4-2.8h-2.7V9.4c0-.8.2-1.4 1.4-1.4h1.5V5.5c-.3 0-1.2-.1-2.3-.1-2.2 0-3.8 1.3-3.8 3.9v2h-2.5V14h2.5v7h3.2Z" />
					</svg>
				</a>
				<a
					href="https://zalo.me"
					target="_blank"
					rel="noreferrer"
					aria-label="Zalo"
					class="inline-flex size-10 items-center justify-center rounded-full border border-orange-200 bg-white text-orange-700 transition hover:bg-orange-100"
				>
					<svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
						<rect x="3.5" y="4.5" width="17" height="13" rx="4"></rect>
						<path d="m8 20.5 2.9-2.9h2.6"></path>
						<path d="M8 9h3.8L8.2 14h3.9"></path>
					</svg>
				</a>
				<a
					href="https://tiktok.com"
					target="_blank"
					rel="noreferrer"
					aria-label="TikTok"
					class="inline-flex size-10 items-center justify-center rounded-full border border-orange-200 bg-white text-orange-700 transition hover:bg-orange-100"
				>
					<svg viewBox="0 0 24 24" class="size-5" fill="currentColor" aria-hidden="true">
						<path d="M16.5 3c.2 1.7 1.2 3 3 3.7v2.6c-1.2-.1-2.3-.5-3.3-1.1V14a5.5 5.5 0 1 1-4.8-5.5v2.8a2.8 2.8 0 1 0 2 2.7V3h3.1Z" />
					</svg>
				</a>
			</div>
		</div>
	</div>
	<p class="container-shell mt-8 text-xs text-slate-500">© {new Date().getFullYear()} Tiệm Lẩu Anh Hai.</p>
</footer>
