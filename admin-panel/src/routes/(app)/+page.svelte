<script lang="ts">
  import Topbar from '$lib/components/Topbar.svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  import Card from '$lib/components/Card.svelte';
  import Badge from '$lib/components/Badge.svelte';
  import { formatINR, formatDate } from '$lib/format';
  import { Users, Building2, CreditCard, MessageSquare, BadgeCheck, Star } from 'lucide-svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const s = $derived(data.stats);
</script>

<Topbar title="Dashboard" subtitle="Platform overview" name={data.session?.name ?? 'Admin'} />

<div class="space-y-6 p-6">
  <div class="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
    <StatCard label="Users" value={s.totalUsers} icon={Users} accent="#38bdf8" href="/users" />
    <StatCard label="Properties" value={s.totalProperties} icon={Building2} accent="#10B981" href="/listings" />
    <StatCard label="Active Plans" value={s.activeSubs} icon={CreditCard} accent="#0F766E" href="/subscriptions" />
    <StatCard label="Inquiries" value={s.totalInquiries} icon={MessageSquare} accent="#a78bfa" />
    <StatCard label="Verified" value={s.verified} icon={BadgeCheck} accent="#D4A24C" href="/listings" />
    <StatCard label="Featured" value={s.featured} icon={Star} accent="#f472b6" href="/listings" />
  </div>

  <div class="grid gap-6 lg:grid-cols-2">
    <Card>
      <div class="mb-4 flex items-center justify-between">
        <h2 class="font-bold text-white">Recent Listings</h2>
        <a href="/listings" class="text-xs font-semibold text-primary">View all</a>
      </div>
      <div class="space-y-3">
        {#each data.recentProperties as p}
          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <div class="truncate text-sm font-medium text-slate-200">{p.title}</div>
              <div class="text-xs text-slate-500">{p.city} · {formatDate(p.createdAt)}</div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-gold">{formatINR(p.price)}</span>
              {#if p.verified}<Badge tone="success">verified</Badge>{:else}<Badge tone="warning">pending</Badge>{/if}
            </div>
          </div>
        {/each}
      </div>
    </Card>

    <Card>
      <div class="mb-4 flex items-center justify-between">
        <h2 class="font-bold text-white">New Users</h2>
        <a href="/users" class="text-xs font-semibold text-primary">View all</a>
      </div>
      <div class="space-y-3">
        {#each data.recentUsers as u}
          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <div class="truncate text-sm font-medium text-slate-200">{u.name ?? 'User'}</div>
              <div class="truncate text-xs text-slate-500">{u.email ?? '—'}</div>
            </div>
            <Badge tone={u.role === 'admin' ? 'danger' : u.role === 'broker' ? 'info' : 'neutral'}>
              {u.role}
            </Badge>
          </div>
        {/each}
      </div>
    </Card>
  </div>

  <Card>
    <h2 class="mb-4 font-bold text-white">Active subscriptions by plan</h2>
    <div class="grid grid-cols-3 gap-4">
      {#each ['free', 'silver', 'gold'] as plan}
        <div class="rounded-xl border border-line bg-ink/50 p-4 text-center">
          <div class="text-2xl font-extrabold text-white">{data.planCounts[plan] ?? 0}</div>
          <div class="text-xs capitalize text-slate-400">{plan}</div>
        </div>
      {/each}
    </div>
  </Card>
</div>
