<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn';

	type Props = {
		value?: string | number;
		class?: string;
	} & Partial<HTMLInputAttributes>;

	let { value = $bindable(''), class: cls, ...rest }: Props = $props();
</script>

<input
	bind:value
	class={cn(
		'h-11 w-full rounded-xl border border-outline-soft bg-surface px-4 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-primary focus:ring-2 focus:ring-primary/15',
		cls
	)}
	{...rest}
/>
