import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { CloudflareEnv, AppVariables } from './types';
import { authMiddleware } from './auth/middleware';
import { authRouter } from './routes/auth';

const app = new Hono<{ Bindings: CloudflareEnv; Variables: AppVariables }>();

app.use('*', cors());
app.use('*', authMiddleware);

// Health check endpoint
app.get('/api/health', (c) => {
  const user = c.get('user');
  return c.json({
    status: 'ok',
    environment: 'cloudflare-workers',
    timestamp: new Date().toISOString(),
    user,
  });
});

// Auth endpoints
app.route('/api/auth', authRouter);

export default app;
