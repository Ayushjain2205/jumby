import { Hono } from 'hono';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';
import { CloudflareEnv, AppVariables } from '../types';
import { hashPassword, verifyPassword } from '../auth/password';
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSession,
  deleteSession,
  generateId,
} from '../auth/session';

export const authRouter = new Hono<{ Bindings: CloudflareEnv; Variables: AppVariables }>();

// GET /api/auth/me - Current user identity
authRouter.get('/me', (c) => {
  const user = c.get('user');
  return c.json({ user });
});

// POST /api/auth/register - Register or upgrade current guest to permanent account
authRouter.post('/register', async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ error: 'Database unavailable' }, 500);
  }

  const body = await c.req.json().catch(() => ({}));
  const { email, username, password, displayName } = body;

  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return c.json({ error: 'Username must be at least 3 characters' }, 400);
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return c.json({ error: 'Password must be at least 6 characters' }, 400);
  }

  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const cleanDisplayName = (displayName || username).trim();
  const cleanEmail = email ? email.trim().toLowerCase() : null;

  // Check username collision
  const existing = await db
    .prepare('SELECT id FROM users WHERE username = ? OR (email IS NOT NULL AND email = ?)')
    .bind(cleanUsername, cleanEmail)
    .first();

  const currentUser = c.get('user');

  // If existing user found and it's not the current user
  if (existing && existing.id !== currentUser?.id) {
    return c.json({ error: 'Username or email already taken' }, 409);
  }

  const passwordHash = await hashPassword(password);

  // If currently an anonymous guest, UPGRADE existing record in-place!
  // This automatically keeps all games and coins created during guest session!
  if (currentUser?.isGuest) {
    await db
      .prepare(`
        UPDATE users
        SET email = ?, username = ?, display_name = ?, password_hash = ?, is_guest = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(cleanEmail, cleanUsername, cleanDisplayName, passwordHash, currentUser.id)
      .run();

    const upgradedUser = {
      id: currentUser.id,
      email: cleanEmail,
      username: cleanUsername,
      displayName: cleanDisplayName,
      avatarUrl: currentUser.avatarUrl,
      isGuest: false,
    };

    c.set('user', upgradedUser);
    return c.json({ success: true, user: upgradedUser, message: 'Account claimed successfully' });
  }

  // Otherwise, create a brand-new permanent user
  const newUserId = generateId('usr');
  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${newUserId}`;

  await db
    .prepare(`
      INSERT INTO users (id, email, username, display_name, avatar_url, password_hash, is_guest)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `)
    .bind(newUserId, cleanEmail, cleanUsername, cleanDisplayName, avatarUrl, passwordHash)
    .run();

  const { token } = await createSession(db, newUserId);
  setCookie(c, SESSION_COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  const newUser = {
    id: newUserId,
    email: cleanEmail,
    username: cleanUsername,
    displayName: cleanDisplayName,
    avatarUrl,
    isGuest: false,
  };

  return c.json({ success: true, user: newUser });
});

// POST /api/auth/login - Log into existing account
authRouter.post('/login', async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ error: 'Database unavailable' }, 500);
  }

  const body = await c.req.json().catch(() => ({}));
  const { identifier, password } = body; // identifier = username or email

  if (!identifier || !password) {
    return c.json({ error: 'Username/email and password required' }, 400);
  }

  const cleanIdent = identifier.trim().toLowerCase();
  const userRow = await db
    .prepare(`
      SELECT id, email, username, display_name as displayName, avatar_url as avatarUrl, password_hash, is_guest
      FROM users
      WHERE (username = ? OR email = ?) AND is_guest = 0
    `)
    .bind(cleanIdent, cleanIdent)
    .first<{
      id: string;
      email: string | null;
      username: string;
      displayName: string;
      avatarUrl: string;
      password_hash: string | null;
      is_guest: number;
    }>();

  if (!userRow || !userRow.password_hash) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const isValid = await verifyPassword(password, userRow.password_hash);
  if (!isValid) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  // Issue new session
  const { token } = await createSession(db, userRow.id);
  setCookie(c, SESSION_COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  const user = {
    id: userRow.id,
    email: userRow.email,
    username: userRow.username,
    displayName: userRow.displayName,
    avatarUrl: userRow.avatarUrl,
    isGuest: false,
  };

  return c.json({ success: true, user });
});

// POST /api/auth/logout - Terminate session
authRouter.post('/logout', async (c) => {
  const db = c.env.DB;
  const token = getCookie(c, SESSION_COOKIE_NAME);
  if (db && token) {
    await deleteSession(db, token);
  }
  deleteCookie(c, SESSION_COOKIE_NAME, { path: '/' });
  return c.json({ success: true });
});
