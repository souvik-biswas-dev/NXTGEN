<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Dialog } from 'bits-ui';
	import X from '@lucide/svelte/icons/x';

	let {
		open = $bindable(false),
		title,
		description,
		children
	}: {
		open?: boolean;
		title: string;
		description?: string;
		children: Snippet;
	} = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay
			class="fixed inset-0 z-[80] bg-navy/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out"
		/>
		<Dialog.Content
			class="fixed left-1/2 top-1/2 z-[90] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-outline-soft/60 bg-surface p-6 shadow-2xl focus:outline-none"
		>
			<div class="mb-4 flex items-start justify-between gap-4">
				<div>
					<Dialog.Title class="font-display text-xl font-extrabold text-navy">{title}</Dialog.Title>
					{#if description}
						<Dialog.Description class="mt-1 text-sm text-ink-soft">{description}</Dialog.Description>
					{/if}
				</div>
				<Dialog.Close
					class="grid size-9 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-card hover:text-ink"
					aria-label="Close"
				>
					<X class="size-5" />
				</Dialog.Close>
			</div>
			{@render children()}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
