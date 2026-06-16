<script lang="ts">
  import { enhance } from '$app/forms';
  import Topbar from '$lib/components/Topbar.svelte';
  import Card from '$lib/components/Card.svelte';
  import Badge from '$lib/components/Badge.svelte';
  import { formatINR, formatDate } from '$lib/format';
  import { Search, Star, ShieldCheck, Trash2 } from 'lucide-svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<Topbar title="Listings" subtitle={`${data.items.length} properties`} name={data.session?.name ?? 'Admin'} />

<div class="space-y-5 p-6">
  <form method="GET" class="flex flex-wrap items-center gap-3">
    <div class="relative min-w-[240px] flex-1">
      <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
      <input name="search" value={data.filters.search} placeholder="Search title or locality…" class="input pl-9" />
    </div>
    <select name="verified" value={data.filters.verified} class="input max-w-[180px]">
      <option value="">All statuses</option>
      <option value="true">Verified</option>
      <option value="false">Unverified</option>
    </select>
    <button class="btn-primary">Filter</button>
  </form>

  <Card class="p-0 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="border-b border-line text-left text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th class="px-5 py-3">Property</th>
            <th class="px-5 py-3">Price</th>
            <th class="px-5 py-3">Contact</th>
            <th class="px-5 py-3">Status</th>
            <th class="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          {#each data.items as p}
            <tr class="hover:bg-panel2/50">
              <td class="px-5 py-3">
                <div class="font-medium text-slate-100">{p.title}</div>
                <div class="text-xs text-slate-500">{p.locality}, {p.city} · {p.bhk} · {formatDate(p.createdAt)}</div>
              </td>
              <td class="px-5 py-3 font-semibold text-gold">{formatINR(p.price)}</td>
              <td class="px-5 py-3 text-slate-400">{p.contact ?? '—'}</td>
              <td class="px-5 py-3">
                <div class="flex gap-1.5">
                  {#if p.verified}<Badge tone="success">verified</Badge>{:else}<Badge tone="warning">pending</Badge>{/if}
                  {#if p.featured}<Badge tone="gold">featured</Badge>{/if}
                </div>
              </td>
              <td class="px-5 py-3">
                <div class="flex items-center justify-end gap-2">
                  <form method="POST" action="?/toggleVerified" use:enhance>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="verified" value={(!p.verified).toString()} />
                    <button class="btn-ghost px-2.5 py-1.5" title={p.verified ? 'Unverify' : 'Verify'}>
                      <ShieldCheck size={15} color={p.verified ? '#10B981' : '#94a3b8'} />
                    </button>
                  </form>
                  <form method="POST" action="?/toggleFeatured" use:enhance>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="featured" value={(!p.featured).toString()} />
                    <button class="btn-ghost px-2.5 py-1.5" title={p.featured ? 'Unfeature' : 'Feature'}>
                      <Star size={15} color={p.featured ? '#D4A24C' : '#94a3b8'} />
                    </button>
                  </form>
                  <form method="POST" action="?/delete" use:enhance>
                    <input type="hidden" name="id" value={p.id} />
                    <button class="btn-ghost px-2.5 py-1.5" title="Delete" onclick={(e) => !confirm('Delete this listing?') && e.preventDefault()}>
                      <Trash2 size={15} color="#fb7185" />
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          {/each}
          {#if data.items.length === 0}
            <tr><td colspan="5" class="px-5 py-12 text-center text-slate-500">No listings found</td></tr>
          {/if}
        </tbody>
      </table>
    </div>
  </Card>
</div>
