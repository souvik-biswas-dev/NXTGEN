<script lang="ts">
	import { page } from '$app/state';
	import Button from '$lib/components/ui/Button.svelte';
	import Building2 from '@lucide/svelte/icons/building-2';
</script>

<section class="container-px grid min-h-screen place-items-center py-32 text-center">
	<div class="max-w-md">
		<span class="mx-auto grid size-16 place-items-center rounded-2xl bg-primary-container text-primary">
			<Building2 class="size-8" />
		</span>
		<p class="mt-6 font-display text-6xl font-extrabold text-navy">{page.status}</p>
		<h1 class="mt-2 font-display text-2xl font-bold text-navy">
			{page.status === 404 ? 'Page not found' : 'Something went wrong'}
		</h1>
		<p class="mt-3 text-ink-soft">{page.error?.message ?? 'An unexpected error occurred.'}</p>
		<div class="mt-8 flex justify-center gap-3">
			<Button href="/">Back home</Button>
			<Button href="/properties" variant="outline">Browse properties</Button>
		</div>
	</div>
</section>
