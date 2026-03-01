<script lang="ts">
	import { MENU_IMAGE } from '$lib/constants/assets';

	const totalPages = 10;
	const pages = Array.from({ length: totalPages }, (_, index) => ({
		number: index + 1,
		image: MENU_IMAGE
	}));

	const totalSpreads = Math.ceil(totalPages / 2);

	let currentSpread = $state(0);
	let isFlipping = $state(false);
	let flipDirection = $state<'next' | 'prev'>('next');
	let targetSpread = $state(0);

	function canGoPrev() {
		return !isFlipping && currentSpread > 0;
	}

	function canGoNext() {
		return !isFlipping && currentSpread < totalSpreads - 1;
	}

	function pageAt(index: number) {
		return pages[index] ?? null;
	}

	function pageInSpread(spreadIndex: number, side: 'left' | 'right') {
		const start = spreadIndex * 2;
		return side === 'left' ? pageAt(start) : pageAt(start + 1);
	}

	function activeLeftPage() {
		return isFlipping && flipDirection === 'prev'
			? pageInSpread(targetSpread, 'left')
			: pageInSpread(currentSpread, 'left');
	}

	function activeRightPage() {
		return isFlipping && flipDirection === 'next'
			? pageInSpread(targetSpread, 'right')
			: pageInSpread(currentSpread, 'right');
	}

	function next() {
		if (!canGoNext()) return;
		flipDirection = 'next';
		targetSpread = currentSpread + 1;
		isFlipping = true;
	}

	function prev() {
		if (!canGoPrev()) return;
		flipDirection = 'prev';
		targetSpread = currentSpread - 1;
		isFlipping = true;
	}

	function onFlipEnd() {
		if (!isFlipping) return;
		currentSpread = targetSpread;
		isFlipping = false;
	}
</script>

<div class="space-y-2">
	<div class="flex items-center gap-2 md:gap-4">
		<button
			type="button"
			class="hidden size-10 shrink-0 items-center justify-center rounded-full border border-orange-300 bg-white/90 text-xl text-orange-800 shadow-sm transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40 md:inline-flex"
			onclick={prev}
			disabled={!canGoPrev()}
			aria-label="Trang trước"
		>
			&#8249;
		</button>
		<div class="menu-book card-surface relative min-w-0 flex-1 overflow-hidden p-2 sm:p-3">
			<div class="book-area">
				<div class="spread">
					<div class="page page-left">
						{#if activeLeftPage()}
							<img src={activeLeftPage()?.image} alt={`Trang ${activeLeftPage()?.number} thực đơn`} class="page-image" />
						{/if}
					</div>

					<div class="page page-right">
						{#if activeRightPage()}
							<img
								src={activeRightPage()?.image}
								alt={`Trang ${activeRightPage()?.number} thực đơn`}
								class="page-image"
							/>
						{/if}
					</div>

					{#if isFlipping && flipDirection === 'next'}
						<div class="flip-sheet flip-sheet-next" onanimationend={onFlipEnd}>
							<div class="flip-face flip-front">
								{#if pageInSpread(currentSpread, 'right')}
									<img
										src={pageInSpread(currentSpread, 'right')?.image}
										alt={`Trang ${pageInSpread(currentSpread, 'right')?.number} thực đơn`}
										class="page-image"
									/>
								{/if}
							</div>
							<div class="flip-face flip-back">
								{#if pageInSpread(targetSpread, 'left')}
									<img
										src={pageInSpread(targetSpread, 'left')?.image}
										alt={`Trang ${pageInSpread(targetSpread, 'left')?.number} thực đơn`}
										class="page-image"
									/>
								{/if}
							</div>
						</div>
					{/if}

					{#if isFlipping && flipDirection === 'prev'}
						<div class="flip-sheet flip-sheet-prev" onanimationend={onFlipEnd}>
							<div class="flip-face flip-front">
								{#if pageInSpread(currentSpread, 'left')}
									<img
										src={pageInSpread(currentSpread, 'left')?.image}
										alt={`Trang ${pageInSpread(currentSpread, 'left')?.number} thực đơn`}
										class="page-image"
									/>
								{/if}
							</div>
							<div class="flip-face flip-back">
								{#if pageInSpread(targetSpread, 'right')}
									<img
										src={pageInSpread(targetSpread, 'right')?.image}
										alt={`Trang ${pageInSpread(targetSpread, 'right')?.number} thực đơn`}
										class="page-image"
									/>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			</div>
			<div class="pointer-events-none absolute inset-x-2 bottom-1.5 flex justify-center sm:inset-x-3 sm:bottom-2">
				<div class="inline-flex rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white">
					Trang {currentSpread * 2 + 1}-{Math.min(totalPages, currentSpread * 2 + 2)}
				</div>
			</div>
		</div>
		<button
			type="button"
			class="hidden size-10 shrink-0 items-center justify-center rounded-full border border-orange-300 bg-white/90 text-xl text-orange-800 shadow-sm transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40 md:inline-flex"
			onclick={next}
			disabled={!canGoNext()}
			aria-label="Trang sau"
		>
			&#8250;
		</button>
	</div>
	<div class="flex items-center justify-between px-1 md:hidden">
		<button
			type="button"
			class="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-orange-300 bg-white/90 text-xl text-orange-800 shadow-sm transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40"
			onclick={prev}
			disabled={!canGoPrev()}
			aria-label="Trang trước"
		>
			&#8249;
		</button>
		<button
			type="button"
			class="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-orange-300 bg-white/90 text-xl text-orange-800 shadow-sm transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40"
			onclick={next}
			disabled={!canGoNext()}
			aria-label="Trang sau"
		>
			&#8250;
		</button>
	</div>
</div>

<style>
	.menu-book {
		background: linear-gradient(180deg, #fef3e8 0%, #fff8f0 100%);
	}

	.book-area {
		perspective: 1600px;
	}

	.spread {
		position: relative;
		display: grid;
		grid-template-columns: 1fr 1fr;
		min-height: min(58vw, 620px);
		border-radius: 0.9rem;
		overflow: hidden;
		background: #f7ecde;
		box-shadow: inset 0 0 0 1px rgba(139, 69, 19, 0.1);
	}

	.page {
		position: relative;
		background: #f9f0e3;
	}

	.page-left {
		border-right: 1px solid rgba(139, 69, 19, 0.2);
	}

	.page-image {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.flip-sheet {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 50%;
		transform-style: preserve-3d;
		will-change: transform;
		animation-duration: 620ms;
		animation-timing-function: cubic-bezier(0.37, 0.01, 0.2, 1);
		animation-fill-mode: forwards;
	}

	.flip-sheet-next {
		right: 0;
		transform-origin: left center;
		animation-name: turn-next;
	}

	.flip-sheet-prev {
		left: 0;
		transform-origin: right center;
		animation-name: turn-prev;
	}

	.flip-face {
		position: absolute;
		inset: 0;
		backface-visibility: hidden;
		overflow: hidden;
	}

	.flip-back {
		transform: rotateY(180deg);
	}

	@keyframes turn-next {
		from {
			transform: rotateY(0deg);
		}
		to {
			transform: rotateY(-180deg);
		}
	}

	@keyframes turn-prev {
		from {
			transform: rotateY(0deg);
		}
		to {
			transform: rotateY(180deg);
		}
	}

	@media (min-width: 768px) {
		.spread {
			min-height: 480px;
		}
	}
</style>
