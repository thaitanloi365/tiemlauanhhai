import { browser } from '$app/environment';
import { writable } from 'svelte/store';

const SESSION_KEY = 'tiemlauanhhai_session_id';

function createSessionStore() {
	const store = writable<string>('');

	if (browser) {
		const existing = localStorage.getItem(SESSION_KEY);
		if (existing) {
			store.set(existing);
		} else {
			const newId = crypto.randomUUID();
			localStorage.setItem(SESSION_KEY, newId);
			store.set(newId);
		}
	}

	return {
		subscribe: store.subscribe,
		getCurrent: () => {
			if (!browser) return '';
			const session = localStorage.getItem(SESSION_KEY);
			if (session) return session;
			const newId = crypto.randomUUID();
			localStorage.setItem(SESSION_KEY, newId);
			return newId;
		}
	};
}

export const sessionStore = createSessionStore();
