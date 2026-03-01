import { browser } from '$app/environment';
import { derived, writable } from 'svelte/store';
import type { CartLine } from '$lib/types';

const STORAGE_KEY = 'tiemlauanhhai_cart';

function loadCart(): CartLine[] {
	if (!browser) return [];
	try {
		const value = localStorage.getItem(STORAGE_KEY);
		return value ? (JSON.parse(value) as CartLine[]) : [];
	} catch {
		return [];
	}
}

function createCartStore() {
	const store = writable<CartLine[]>(loadCart());

	if (browser) {
		store.subscribe((value) => localStorage.setItem(STORAGE_KEY, JSON.stringify(value)));
		window.addEventListener('storage', (event) => {
			if (event.key === STORAGE_KEY) {
				store.set(loadCart());
			}
		});
	}

	return {
		subscribe: store.subscribe,
		add: (line: Omit<CartLine, 'quantity'>, quantity = 1) =>
			store.update((lines) => {
				const idx = lines.findIndex((item) => item.variantId === line.variantId);
				if (idx >= 0) {
					lines[idx].quantity += quantity;
					return [...lines];
				}
				return [...lines, { ...line, quantity }];
			}),
		updateQuantity: (variantId: string, quantity: number) =>
			store.update((lines) =>
				lines
					.map((line) => (line.variantId === variantId ? { ...line, quantity: Math.max(1, quantity) } : line))
					.filter((line) => line.quantity > 0)
			),
		remove: (variantId: string) => store.update((lines) => lines.filter((line) => line.variantId !== variantId)),
		clear: () => store.set([])
	};
}

export const cartStore = createCartStore();

export const cartCount = derived(cartStore, ($cartStore) =>
	$cartStore.reduce((sum, line) => sum + line.quantity, 0)
);

export const cartTotal = derived(cartStore, ($cartStore) =>
	$cartStore.reduce((sum, line) => sum + line.quantity * line.price, 0)
);
