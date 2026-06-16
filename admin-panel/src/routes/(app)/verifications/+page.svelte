<script lang="ts">
  import { enhance } from '$app/forms';
  import Topbar from '$lib/components/Topbar.svelte';
  import Card from '$lib/components/Card.svelte';
  import Badge from '$lib/components/Badge.svelte';
  import { formatDate } from '$lib/format';
  import { BadgeCheck, X } from 'lucide-svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const tone = (s: string) => (s === 'approved' ? 'success' : s === 'rejected' ? 'danger' : 'warning');
</script>

<Topbar title="Broker Verifications" subtitle={`${data.items.length} requests`} name={data.session?.name ?? 'Admin'} />

<div class="grid gap-4 p-6 lg:grid-cols-2">
  {#each data.items as v}
    <Card>
      <div class="mb-3 flex items-start justify-between">
        <div>
          <div class="font-semibold text-white">{v.fullName}</div>
          <div class="text-xs text-slate-500">{v.profile?.email ?? '—'} · submitted {formatDate(v.submittedAt)}</div>
        </div>
        <Badge tone={tone(v.status)}>{v.status}</Badge>
      </div>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div><div class="text-xs text-slate-500">RERA ID</div><div class="text-slate-200">{v.reraId}</div></div>
        <div><div class="text-xs text-slate-500">Agency</div><div class="text-slate-200">{v.agencyName ?? '—'}</div></div>
        <div><div class="text-xs text-slate-500">Experience</div><div class="text-slate-200">{v.yearsExperience ?? '—'} yrs</div></div>
      </div>
      <div class="mt-3 text-xs text-slate-500">Documents: {[v.idDocumentUrl, v.reraDocumentUrl, v.agencyDocumentUrl].filter(Boolean).length} uploaded (private)</div>

      {#if v.status === 'pending'}
        <div class="mt-4 flex gap-2">
          <form method="POST" action="?/review" use:enhance class="flex-1">
            <input type="hidden" name="id" value={v.id} />
            <input type="hidden" name="status" value="approved" />
            <button class="btn-primary w-full"><BadgeCheck size={16} /> Approve</button>
          </form>
          <form method="POST" action="?/review" use:enhance class="flex-1">
            <input type="hidden" name="id" value={v.id} />
            <input type="hidden" name="status" value="rejected" />
            <button class="btn-ghost w-full"><X size={16} /> Reject</button>
          </form>
        </div>
      {:else if v.reviewerNotes}
        <div class="mt-3 rounded-lg bg-ink/60 px-3 py-2 text-xs text-slate-400">Note: {v.reviewerNotes}</div>
      {/if}
    </Card>
  {/each}
  {#if data.items.length === 0}
    <Card class="lg:col-span-2"><p class="py-8 text-center text-slate-500">No verification requests</p></Card>
  {/if}
</div>
