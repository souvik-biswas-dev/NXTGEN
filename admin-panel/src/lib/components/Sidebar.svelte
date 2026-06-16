<script lang="ts">
  import { page } from '$app/stores';
  import {
    LayoutDashboard,
    Building2,
    Users,
    Flag,
    BadgeCheck,
    CreditCard,
    Database,
    BarChart3,
    Home,
  } from 'lucide-svelte';

  const nav = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/listings', label: 'Listings', icon: Building2 },
    { href: '/users', label: 'Users', icon: Users },
    { href: '/verifications', label: 'Verifications', icon: BadgeCheck },
    { href: '/reports', label: 'Reports', icon: Flag },
    { href: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
    { href: '/platform-data', label: 'Platform Data', icon: Database },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const active = (href: string, path: string) =>
    href === '/' ? path === '/' : path.startsWith(href);
</script>

<aside class="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-line bg-panel/60 p-4 backdrop-blur md:block">
  <div class="mb-8 flex items-center gap-2 px-2">
    <div class="grid h-9 w-9 place-items-center rounded-xl bg-primary">
      <Home size={18} color="#fff" />
    </div>
    <div>
      <div class="text-sm font-extrabold leading-none text-white">NxtGen</div>
      <div class="text-[11px] text-gold">Admin</div>
    </div>
  </div>

  <nav class="space-y-1">
    {#each nav as item}
      {@const isActive = active(item.href, $page.url.pathname)}
      <a
        href={item.href}
        class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors {isActive
          ? 'bg-primary/15 text-primary'
          : 'text-slate-400 hover:bg-panel2 hover:text-slate-200'}"
      >
        <item.icon size={18} />
        {item.label}
        {#if isActive}
          <span class="ml-auto h-1.5 w-1.5 rounded-full bg-primary"></span>
        {/if}
      </a>
    {/each}
  </nav>
</aside>
