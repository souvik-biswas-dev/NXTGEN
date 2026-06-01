import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { createNodeWebSocket } from '@hono/node-ws';
import { env } from '@/config/env';
import { handleError } from '@/lib/errors';
import { verifyAccessToken } from '@/lib/jwt';
import { addClient, removeClient } from '@/ws/hub';
import type { AppEnv } from '@/types';

import { authRoutes } from '@/routes/auth';
import { propertyRoutes } from '@/routes/properties';
import { uploadRoutes } from '@/routes/uploads';
import { platformRoutes } from '@/routes/platform';
import { engagementRoutes } from '@/routes/engagement';
import { inquiryRoutes } from '@/routes/inquiries';
import { chatRoutes } from '@/routes/chat';
import { paymentRoutes } from '@/routes/payments';
import { notificationRoutes } from '@/routes/notifications';
import { reviewRoutes } from '@/routes/reviews';
import { catalogRoutes } from '@/routes/catalog';
import { brokerRoutes } from '@/routes/broker';
import { userRoutes } from '@/routes/users';
import { preferenceRoutes } from '@/routes/preferences';
import { adminRoutes } from '@/routes/admin';

const app = new Hono<AppEnv>();
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: env.corsOrigins.includes('*') ? '*' : env.corsOrigins,
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Authorization', 'Content-Type'],
  })
);

app.get('/health', (c) => c.json({ ok: true, ts: Date.now() }));

// REST routes
app.route('/auth', authRoutes);
app.route('/properties', propertyRoutes);
app.route('/uploads', uploadRoutes);
app.route('/platform-data', platformRoutes);
app.route('/', engagementRoutes); // /favorites, /recently-viewed
app.route('/', inquiryRoutes); // /inquiries, /offers
app.route('/chat', chatRoutes);
app.route('/payments', paymentRoutes);
app.route('/notifications', notificationRoutes);
app.route('/reviews', reviewRoutes);
app.route('/catalog', catalogRoutes);
app.route('/broker', brokerRoutes);
app.route('/users', userRoutes);
app.route('/preferences', preferenceRoutes);
app.route('/admin', adminRoutes);

// ── Realtime chat WebSocket ──────────────────────────────────────
// Client connects to /ws?token=<accessToken>. We authenticate on open and
// register the socket with the hub keyed by userId.
app.get(
  '/ws',
  upgradeWebSocket((c) => {
    const token = c.req.query('token') ?? '';
    let client: ReturnType<typeof addClient> | null = null;
    return {
      async onOpen(_evt, ws) {
        try {
          const claims = await verifyAccessToken(token);
          client = addClient(claims.sub, ws);
          ws.send(JSON.stringify({ type: 'connected' }));
        } catch {
          ws.close(1008, 'unauthorized');
        }
      },
      onClose() {
        if (client) removeClient(client);
      },
    };
  })
);

app.onError(handleError);

const server = serve({ fetch: app.fetch, port: env.port }, (info) => {
  console.log(`🚀 NxtGenProperties API on http://localhost:${info.port}`);
});
injectWebSocket(server);
