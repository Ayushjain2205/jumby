import { Context, Next } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  getUserFromSession,
  createGuestUser,
} from './session';
import { CloudflareEnv, AppVariables } from '../types';

export async function authMiddleware(
  c: Context<{ Bindings: CloudflareEnv; Variables: AppVariables }>,
  next: Next
) {
  const db = c.env.DB;
  if (!db) {
    // Safe fallback if D1 is not initialized
    c.set('user', {
      id: 'usr_local',
      email: null,
      username: 'creator',
      displayName: 'Creator',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=creator',
      isGuest: true,
    });
    return next();
  }

  const sessionToken = getCookie(c, SESSION_COOKIE_NAME);
  let user = sessionToken ? await getUserFromSession(db, sessionToken) : null;

  // Auto-provision seamless guest identity if none exists or session expired
  if (!user) {
    try {
      const { user: newGuest, token } = await createGuestUser(db);
      user = newGuest;
      setCookie(c, SESSION_COOKIE_NAME, token, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
        maxAge: SESSION_MAX_AGE_SECONDS,
      });
    } catch (err) {
      console.error('[authMiddleware] Failed to auto-provision guest user:', err);
      user = {
        id: 'usr_fallback',
        email: null,
        username: 'guest',
        displayName: 'Guest Player',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=guest',
        isGuest: true,
      };
    }
  }

  c.set('user', user);
  await next();
}
