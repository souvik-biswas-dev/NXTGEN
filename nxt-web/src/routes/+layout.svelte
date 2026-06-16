<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { auth } from '$lib/stores/auth.svelte';
	import { favorites } from '$lib/stores/favorites.svelte';
	import SmoothScroll from '$lib/components/SmoothScroll.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { children } = $props();

	// Auth screens are full-bleed — no marketing chrome.
	const bare = $derived(['/login', '/register'].includes(page.url.pathname));

	onMount(() => {
		auth.init().then(() => favorites.init());
	});
</script>

<SmoothScroll>
	{#if bare}
		{@render children()}
	{:else}
		<Navbar />
		<main class="min-h-screen">
			{@render children()}
		</main>
		<Footer />
	{/if}
</SmoothScroll>
