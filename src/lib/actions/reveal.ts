type RevealOptions = {
	delay?: number;
	threshold?: number;
	rootMargin?: string;
};

const hasReducedMotion =
	typeof window !== 'undefined' &&
	window.matchMedia &&
	window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function reveal(node: HTMLElement, options: RevealOptions = {}) {
	if (hasReducedMotion || typeof IntersectionObserver === 'undefined') {
		node.classList.add('revealed');
		return {};
	}

	const applyOptions = (nextOptions: RevealOptions) => {
		const delay = nextOptions.delay ?? 0;
		node.style.transitionDelay = `${delay}ms`;
	};

	applyOptions(options);
	node.classList.add('reveal-init');

	const observer = new IntersectionObserver(
		(entries) => {
			const entry = entries[0];
			if (!entry?.isIntersecting) return;
			node.classList.add('revealed');
			observer.disconnect();
		},
		{
			threshold: options.threshold ?? 0.15,
			rootMargin: options.rootMargin ?? '0px 0px -10% 0px'
		}
	);

	observer.observe(node);

	return {
		update(nextOptions: RevealOptions) {
			options = nextOptions;
			applyOptions(options);
		},
		destroy() {
			observer.disconnect();
		}
	};
}
