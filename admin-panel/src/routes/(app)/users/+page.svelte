<script lang="ts">
  import { enhance } from '$app/forms';
  import Topbar from '$lib/components/Topbar.svelte';
  import Card from '$lib/components/Card.svelte';
  import Badge from '$lib/components/Badge.svelte';
  import { formatDate } from '$lib/format';
  import { Search, Trash2 } from 'lucide-svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const roles = ['buyer', 'owner', 'broker', 'admin'];
  const tone = (r: string) => (r === 'admin' ? 'danger' : r === 'broker' ? 'info' : r === 'owner' ? 'warning' : 'neutral');
</script>

<Topbar title="Users" subtitle={`${data.items.length} accounts`} name={data.session?.name ?? 'Admin'} />

<div class="space-y-5 p-6">
  <form method="GET" class="flex flex-wrap items-center gap-3">
    <div class="relative min-w-[240px] flex-1">
      <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
      <input name="search" value={data.filters.search} placeholder="Search name or email…" class="input pl-9" />
    </div>
    <select name="role" value={data.filters.role} class="input max-w-[180px]">
      <option value="">All roles</option>
      {#each roles as r}<option value={r}>{r}</option>{/each}
    </select>
    <button class="btn-primary">Filter</button>
  </form>

  <Card class="p-0 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="border-b border-line text-left text-xs uppercase tracking-wider text-slate-500">
          <tr><th class="px-5 py-3">User</th><th class="px-5 py-3">Role</th><th class="px-5 py-3">Joined</th><th class="px-5 py-3 text-right">Actions</th></tr>
        </thead>
        <tbody class="divide-y divide-line">
          {#each data.items as u}
            <tr class="hover:bg-panel2/50">
              <td class="px-5 py-3">
                <div class="font-medium text-slate-100">{u.name ?? 'User'}</div>
                <div class="text-xs text-slate-500">{u.email ?? u.phone ?? '—'}</div>
              </td>
              <td class="px-5 py-3">
                <div class="flex items-center gap-2">
                  <Badge tone={tone(u.role)}>{u.role}</Badge>
                  {#if u.verifiedBroker}<Badge tone="success">RERA</Badge>{/if}
                </div>
              </td>
              <td class="px-5 py-3 text-slate-400">{formatDate(u.createdAt)}</td>
              <td class="px-5 py-3">
                <div class="flex items-center justify-end gap-2">
                  <form method="POST" action="?/setRole" use:enhance>
                    <input type="hidden" name="id" value={u.userId} />
                    <select name="role" class="input w-[120px] py-1.5" onchange={(e) => (e.currentTarget.form as HTMLFormElement).requestSubmit()}>
                      {#each roles as r}<option value={r} selected={r === u.role}>{r}</option>{/each}
                    </select>
                  </form>
                  <form method="POST" action="?/toggleBroker" use:enhance>
                    <input type="hidden" name="id" value={u.userId} />
                    <input type="hidden" name="verified" value={(!u.verifiedBroker).toString()} />
                    <button class="btn-ghost px-3 py-1.5 text-xs">{u.verifiedBroker ? 'Unverify' : 'Verify broker'}</button>
                  </form>
                  <form method="POST" action="?/delete" use:enhance>
                    <input type="hidden" name="id" value={u.userId} />
                    <button class="btn-ghost px-2.5 py-1.5" title="Delete" onclick={(e) => !confirm('Delete this user?') && e.preventDefault()}>
                      <Trash2 size={15} color="#fb7185" />
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          {/each}
          {#if data.items.length === 0}<tr><td colspan="4" class="px-5 py-12 text-center text-slate-500">No users found</td></tr>{/if}
        </tbody>
      </table>
    </div>
  </Card>
</div>
