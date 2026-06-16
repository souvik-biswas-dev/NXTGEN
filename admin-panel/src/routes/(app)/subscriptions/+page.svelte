<script lang="ts">
  import { enhance } from '$app/forms';
  import Topbar from '$lib/components/Topbar.svelte';
  import Card from '$lib/components/Card.svelte';
  import Badge from '$lib/components/Badge.svelte';
  import { formatDate } from '$lib/format';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const tone = (s: string) => (s === 'active' ? 'success' : s === 'cancelled' ? 'neutral' : 'warning');
  const planTone = (p: string) => (p === 'gold' ? 'gold' : p === 'silver' ? 'info' : 'neutral');
</script>

<Topbar title="Subscriptions" subtitle={`${data.items.length} total`} name={data.session?.name ?? 'Admin'} />

<div class="space-y-5 p-6">
  <form method="GET" class="flex gap-3">
    <select name="status" value={data.filters.status} class="input max-w-[200px]">
      <option value="">All statuses</option><option value="active">Active</option>
      <option value="cancelled">Cancelled</option><option value="expired">Expired</option>
    </select>
    <button class="btn-primary">Filter</button>
  </form>

  <Card class="p-0 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="border-b border-line text-left text-xs uppercase tracking-wider text-slate-500">
          <tr><th class="px-5 py-3">User</th><th class="px-5 py-3">Plan</th><th class="px-5 py-3">Status</th><th class="px-5 py-3">Ends</th><th class="px-5 py-3 text-right">Actions</th></tr>
        </thead>
        <tbody class="divide-y divide-line">
          {#each data.items as s}
            <tr class="hover:bg-panel2/50">
              <td class="px-5 py-3"><div class="font-medium text-slate-100">{s.user?.name ?? '—'}</div><div class="text-xs text-slate-500">{s.user?.email ?? ''}</div></td>
              <td class="px-5 py-3"><Badge tone={planTone(s.plan)}>{s.plan}</Badge></td>
              <td class="px-5 py-3"><Badge tone={tone(s.status)}>{s.status}</Badge></td>
              <td class="px-5 py-3 text-slate-400">{formatDate(s.endsAt)}</td>
              <td class="px-5 py-3">
                <div class="flex items-center justify-end gap-2">
                  <form method="POST" action="?/extend" use:enhance class="flex items-center gap-1">
                    <input type="hidden" name="id" value={s.id} />
                    <input name="days" type="number" min="1" max="730" value="30" class="input w-20 py-1.5" />
                    <button class="btn-ghost px-3 py-1.5 text-xs">Extend</button>
                  </form>
                  {#if s.status === 'active'}
                    <form method="POST" action="?/cancel" use:enhance>
                      <input type="hidden" name="id" value={s.id} />
                      <button class="btn-ghost px-3 py-1.5 text-xs">Cancel</button>
                    </form>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
          {#if data.items.length === 0}<tr><td colspan="5" class="px-5 py-12 text-center text-slate-500">No subscriptions</td></tr>{/if}
        </tbody>
      </table>
    </div>
  </Card>
</div>
