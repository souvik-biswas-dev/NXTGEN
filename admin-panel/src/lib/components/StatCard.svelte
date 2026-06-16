<script lang="ts">
  // lucide-svelte icon components; typed loosely to accept their prop shape.
  let {
    label,
    value,
    icon,
    accent = '#0F766E',
    href,
  }: {
    label: string;
    value: string | number;
    icon: any;
    accent?: string;
    href?: string;
  } = $props();

  const Icon = $derived(icon);
</script>

<svelte:element
  this={href ? 'a' : 'div'}
  {href}
  class="card group relative overflow-hidden p-5 transition-transform hover:-translate-y-0.5"
>
  <div
    class="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
    style="background:{accent}"
  ></div>
  <div class="flex items-center gap-3">
    <div class="grid h-10 w-10 place-items-center rounded-xl" style="background:{accent}1A">
      <Icon size={20} color={accent} />
    </div>
    <div>
      <div class="text-2xl font-extrabold text-white">{value}</div>
      <div class="text-xs text-slate-400">{label}</div>
    </div>
  </div>
</svelte:element>
