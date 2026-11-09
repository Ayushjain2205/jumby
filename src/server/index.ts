import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { CloudflareEnv, AppVariables } from './types';

const app = new Hono<{ Bindings: CloudflareEnv; Variables: AppVariables }>();

app.use('*', cors());

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    environment: 'cloudflare-workers',
    timestamp: new Date().toISOString(),
  });
});

export default app;
