<script lang="ts">
	import { cn } from '$lib/utils/cn';

	// The NxtGenProperties brand mark, ported 1:1 from the Expo app's
	// assets/brand-mark.svg — gold roof + white building body + teal "next-gen"
	// up-arrow, set on a teal-gradient squircle (matches the app icon / splash).
	let {
		class: cls,
		size = 36,
		tile = true
	}: { class?: string; size?: number; tile?: boolean } = $props();
</script>

<span
	class={cn(
		'relative grid shrink-0 place-items-center overflow-hidden',
		tile && 'rounded-[28%] bg-linear-to-br from-[#159a90] via-primary to-[#0b3f3a] shadow-sm ring-1 ring-black/5',
		cls
	)}
	style="width:{size}px;height:{size}px"
>
	<svg
		viewBox="0 0 1024 1024"
		class={tile ? 'h-[66%] w-[66%]' : 'h-full w-full'}
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
	>
		<!-- roof -->
		<polygon
			points="512,250 818,476 206,476"
			fill="#D4A24C"
			stroke="#D4A24C"
			stroke-width="10"
			stroke-linejoin="round"
		/>
		<!-- building body -->
		<rect x="292" y="458" width="440" height="320" rx="44" ry="44" fill="#FFFFFF" />
		<!-- upward arrow = next-gen growth -->
		<polygon
			points="512,498 632,618 568,618 568,730 456,730 456,618 392,618"
			fill="#0F766E"
			stroke="#0F766E"
			stroke-width="6"
			stroke-linejoin="round"
		/>
	</svg>
</span>
