import type { Action } from 'svelte/action';

interface RevealOpts {
	/** Stagger delay in ms. */
	delay?: number;
	/** Intersection threshold (0–1). */
	threshold?: number;
	/** Only reveal once (default true). */
	once?: boolean;
}

/**
 * `use:reveal` — adds `.reveal` immediately and `.is-visible` when the element
 * scrolls into view, driving the CSS fade-up transition in app.css.
 */
export const reveal: Action<HTMLElement, RevealOpts | undefined> = (node, opts = {}) => {
	const { delay = 0, threshold = 0.15, once = true } = opts ?? {};
	node.classList.add('reveal');
	if (delay) node.style.transitionDelay = `${delay}ms`;

	const io = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					node.classList.add('is-visible');
					if (once) io.unobserve(node);
				} else if (!once) {
					node.classList.remove('is-visible');
				}
			}
		},
		{ threshold, rootMargin: '0px 0px -8% 0px' }
	);
	io.observe(node);

	return {
		destroy() {
			io.disconnect();
		}
	};
};
