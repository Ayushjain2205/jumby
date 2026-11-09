import { UserSession } from '../types';

export const SESSION_COOKIE_NAME = 'jumby_session';
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

export function generateId(prefix: string): string {
  const random = crypto.randomUUID().replace(/-/g, '').substring(0, 12);
  return `${prefix}_${random}`;
}

export async function createGuestUser(
  db: D1Database
): Promise<{ user: UserSession; token: string }> {
  const userId = generateId('usr_anon');
  const shortSuffix = Math.random().toString(36).substring(2, 6);
  const username = `guest_${shortSuffix}`;
  const displayName = `Guest ${shortSuffix.toUpperCase()}`;
  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`;

  // Insert guest user
  await db
    .prepare(`
      INSERT INTO users (id, email, username, display_name, avatar_url, password_hash, is_guest)
      VALUES (?, NULL, ?, ?, ?, NULL, 1)
    `)
    .bind(userId, username, displayName, avatarUrl)
    .run();

  const user: UserSession = {
    id: userId,
    email: null,
    username,
    displayName,
    avatarUrl,
    isGuest: true,
  };

  const { token } = await createSession(db, userId);
  return { user, token };
}

export async function createSession(
  db: D1Database,
  userId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ token: string; expiresAt: string }> {
  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString();

  await db
    .prepare(`
      INSERT INTO sessions (id, user_id, expires_at, user_agent, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `)
    .bind(token, userId, expiresAt, userAgent || null, ipAddress || null)
    .run();

  return { token, expiresAt };
}

export async function getUserFromSession(
  db: D1Database,
  sessionToken: string
): Promise<UserSession | null> {
  if (!sessionToken || sessionToken.length < 16) return null;

  try {
    const row = await db
      .prepare(`
        SELECT 
          u.id, 
          u.email, 
          u.username, 
          u.display_name as displayName, 
          u.avatar_url as avatarUrl, 
          u.is_guest as isGuest
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = ? AND s.expires_at > CURRENT_TIMESTAMP
      `)
      .bind(sessionToken)
      .first<{
        id: string;
        email: string | null;
        username: string;
        displayName: string;
        avatarUrl: string;
        isGuest: number;
      }>();

    if (!row) return null;

    return {
      id: row.id,
      email: row.email,
      username: row.username,
      displayName: row.displayName,
      avatarUrl: row.avatarUrl,
      isGuest: Boolean(row.isGuest),
    };
  } catch (err) {
    console.error('[getUserFromSession] DB query error:', err);
    return null;
  }
}

export async function deleteSession(db: D1Database, sessionToken: string): Promise<void> {
  if (!sessionToken) return;
  await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionToken).run();
}
