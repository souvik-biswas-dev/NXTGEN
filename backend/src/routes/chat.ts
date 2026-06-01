import { Hono } from 'hono';
import { z } from 'zod';
import { and, eq, or, ne, asc, desc, inArray, count } from 'drizzle-orm';
import { db } from '@/db';
import { conversations, messages, usersProfiles } from '@/db/schema';
import { requireAuth, mustUser } from '@/middleware/auth';
import { badRequest, forbidden, notFound } from '@/lib/errors';
import { emitToUsers, isOnline } from '@/ws/hub';
import { sendPush } from '@/lib/push';
import type { AppEnv } from '@/types';

export const chatRoutes = new Hono<AppEnv>();

async function assertParticipant(conversationId: string, userId: string) {
  const conv = await db.query.conversations.findFirst({ where: eq(conversations.id, conversationId) });
  if (!conv) throw notFound('Conversation not found');
  if (conv.participant1 !== userId && conv.participant2 !== userId) {
    throw forbidden('Not a participant');
  }
  return conv;
}

// ── List conversations (+ other_user profile, unread_count) ──────
chatRoutes.get('/conversations', requireAuth, async (c) => {
  const u = mustUser(c);
  const convs = await db
    .select()
    .from(conversations)
    .where(or(eq(conversations.participant1, u.id), eq(conversations.participant2, u.id)))
    .orderBy(desc(conversations.lastMessageAt));
  if (!convs.length) return c.json({ items: [] });

  const otherIds = convs.map((c2) => (c2.participant1 === u.id ? c2.participant2 : c2.participant1));
  const convIds = convs.map((c2) => c2.id);
  const profiles = await db
    .select()
    .from(usersProfiles)
    .where(inArray(usersProfiles.userId, otherIds));
  const profileMap = Object.fromEntries(profiles.map((p) => [p.userId, p]));

  const unread = await db
    .select({ conversationId: messages.conversationId, n: count() })
    .from(messages)
    .where(and(inArray(messages.conversationId, convIds), eq(messages.read, false), ne(messages.senderId, u.id)))
    .groupBy(messages.conversationId);
  const unreadMap = Object.fromEntries(unread.map((r) => [r.conversationId, Number(r.n)]));

  const items = convs.map((c2) => {
    const otherId = c2.participant1 === u.id ? c2.participant2 : c2.participant1;
    return { ...c2, other_user: profileMap[otherId] ?? null, unread_count: unreadMap[c2.id] ?? 0 };
  });
  return c.json({ items });
});

// ── Get-or-create a conversation ─────────────────────────────────
chatRoutes.post('/conversations', requireAuth, async (c) => {
  const u = mustUser(c);
  const b = z
    .object({ otherUserId: z.string().uuid(), propertyId: z.string().uuid().optional() })
    .parse(await c.req.json());
  if (b.otherUserId === u.id) throw badRequest('Cannot start a chat with yourself');

  const existing = await db.query.conversations.findFirst({
    where: or(
      and(eq(conversations.participant1, u.id), eq(conversations.participant2, b.otherUserId)),
      and(eq(conversations.participant1, b.otherUserId), eq(conversations.participant2, u.id))
    ),
  });
  if (existing) return c.json({ id: existing.id });

  const [row] = await db
    .insert(conversations)
    .values({ participant1: u.id, participant2: b.otherUserId, propertyId: b.propertyId ?? null })
    .returning({ id: conversations.id });
  return c.json({ id: row.id }, 201);
});

// ── Messages in a conversation ───────────────────────────────────
chatRoutes.get('/conversations/:id/messages', requireAuth, async (c) => {
  const u = mustUser(c);
  const id = c.req.param('id');
  await assertParticipant(id, u.id);
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt));
  return c.json({ items: rows });
});

// ── Send a message (persist → bump conversation → realtime + push)
chatRoutes.post('/conversations/:id/messages', requireAuth, async (c) => {
  const u = mustUser(c);
  const id = c.req.param('id');
  const conv = await assertParticipant(id, u.id);
  const { content } = z.object({ content: z.string().min(1) }).parse(await c.req.json());

  const [msg] = await db
    .insert(messages)
    .values({ conversationId: id, senderId: u.id, content: content.trim() })
    .returning();

  // Replaces the DB trigger update_conversation_last_message.
  await db
    .update(conversations)
    .set({ lastMessage: msg.content, lastMessageAt: msg.createdAt })
    .where(eq(conversations.id, id));

  const recipient = conv.participant1 === u.id ? conv.participant2 : conv.participant1;
  emitToUsers([conv.participant1, conv.participant2], {
    type: 'message:new',
    conversationId: id,
    payload: msg,
  });
  // Push only if the recipient isn't connected right now.
  if (!isOnline(recipient)) {
    await sendPush({
      userIds: [recipient],
      title: 'New message',
      body: msg.content.slice(0, 120),
      data: { conversationId: id },
    });
  }
  return c.json(msg, 201);
});

// ── Mark read ─────────────────────────────────────────────────────
chatRoutes.post('/conversations/:id/read', requireAuth, async (c) => {
  const u = mustUser(c);
  const id = c.req.param('id');
  const conv = await assertParticipant(id, u.id);
  await db
    .update(messages)
    .set({ read: true })
    .where(and(eq(messages.conversationId, id), ne(messages.senderId, u.id), eq(messages.read, false)));
  const other = conv.participant1 === u.id ? conv.participant2 : conv.participant1;
  emitToUsers([other], { type: 'message:read', conversationId: id, payload: { by: u.id } });
  return c.json({ ok: true });
});

// ── Unread count (badge) ─────────────────────────────────────────
chatRoutes.get('/unread-count', requireAuth, async (c) => {
  const u = mustUser(c);
  const convs = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(or(eq(conversations.participant1, u.id), eq(conversations.participant2, u.id)));
  if (!convs.length) return c.json({ count: 0 });
  const [{ n }] = await db
    .select({ n: count() })
    .from(messages)
    .where(
      and(
        inArray(messages.conversationId, convs.map((x) => x.id)),
        eq(messages.read, false),
        ne(messages.senderId, u.id)
      )
    );
  return c.json({ count: Number(n) });
});
