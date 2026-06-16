<script lang="ts">
	import { cn } from '$lib/utils/cn';
	let { class: cls }: { class?: string } = $props();
</script>

<div class={cn('skeleton rounded-xl', cls)}></div>
