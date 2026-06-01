import { api, getAccessToken } from '@/lib/api';

// Thin WebSocket client for realtime chat (replaces Supabase Realtime).
// One shared socket per app session; consumers subscribe to typed events.

export interface RealtimeEvent {
  type: 'connected' | 'message:new' | 'message:read' | 'conversation:new';
  conversationId?: string;
  payload?: unknown;
}

type Handler = (e: RealtimeEvent) => void;

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let shouldRun = false;
const handlers = new Set<Handler>();

function wsUrl(token: string): string {
  const base = api.url.replace(/^http/, 'ws');
  return `${base}/ws?token=${encodeURIComponent(token)}`;
}

async function connect() {
  if (!shouldRun) return;
  const token = await getAccessToken();
  if (!token) return;

  socket = new WebSocket(wsUrl(token));

  socket.onmessage = (evt) => {
    try {
      const data = JSON.parse(typeof evt.data === 'string' ? evt.data : '') as RealtimeEvent;
      for (const h of handlers) h(data);
    } catch {
      /* ignore malformed frames */
    }
  };
  socket.onclose = () => {
    socket = null;
    if (shouldRun) {
      reconnectTimer = setTimeout(connect, 2000); // simple backoff
    }
  };
  socket.onerror = () => socket?.close();
}

export const realtime = {
  start() {
    if (shouldRun) return;
    shouldRun = true;
    connect();
  },
  stop() {
    shouldRun = false;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    socket?.close();
    socket = null;
  },
  subscribe(handler: Handler): () => void {
    handlers.add(handler);
    if (!socket && shouldRun) connect();
    return () => handlers.delete(handler);
  },
};
