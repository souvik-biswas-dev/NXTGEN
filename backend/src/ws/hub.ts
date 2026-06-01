import type { WSContext } from 'hono/ws';

// In-memory pub/sub hub for realtime chat. Replaces Supabase Realtime.
// Each socket belongs to one userId. We fan messages out by userId, so a
// recipient receives events whether they're viewing the room or the inbox.
//
// NOTE: this is single-process. For multi-instance deploys, back this with
// Redis pub/sub (the public API here stays the same).

type Client = { userId: string; ws: WSContext };

const clients = new Set<Client>();

export function addClient(userId: string, ws: WSContext): Client {
  const client: Client = { userId, ws };
  clients.add(client);
  return client;
}

export function removeClient(client: Client): void {
  clients.delete(client);
}

export interface RealtimeEvent {
  type: 'message:new' | 'message:read' | 'conversation:new';
  conversationId?: string;
  payload: unknown;
}

/** Send an event to every live socket belonging to the given users. */
export function emitToUsers(userIds: string[], event: RealtimeEvent): void {
  const set = new Set(userIds);
  const data = JSON.stringify(event);
  for (const c of clients) {
    if (set.has(c.userId)) {
      try {
        c.ws.send(data);
      } catch {
        /* socket closing — ignore */
      }
    }
  }
}

/** Is the user currently connected (used to decide whether to push). */
export function isOnline(userId: string): boolean {
  for (const c of clients) if (c.userId === userId) return true;
  return false;
}
