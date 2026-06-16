<script lang="ts">
	import type { HTMLSelectAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';

	type Option = { value: string; label: string };
	type Props = {
		value?: string;
		options: Option[];
		placeholder?: string;
		class?: string;
	} & Partial<HTMLSelectAttributes>;

	let { value = $bindable(''), options, placeholder, class: cls, ...rest }: Props = $props();
</script>

<div class={cn('relative', cls)}>
	<select
		bind:value
		class="h-11 w-full appearance-none rounded-xl border border-outline-soft bg-surface pl-4 pr-10 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
		{...rest}
	>
		{#if placeholder}<option value="" disabled>{placeholder}</option>{/if}
		{#each options as opt (opt.value)}
			<option value={opt.value}>{opt.label}</option>
		{/each}
	</select>
	<ChevronDown class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
</div>
