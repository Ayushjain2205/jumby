export interface CloudflareEnv {
  DB: D1Database;
  GAMES_BUCKET: R2Bucket;
  CACHE_KV: KVNamespace;
  ASSETS?: Fetcher;
  GEMINI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  OPENAI_API_KEY?: string;
}

export interface UserSession {
  id: string;
  email: string | null;
  username: string;
  displayName: string;
  avatarUrl: string;
  isGuest: boolean;
}

export type AppVariables = {
  user: UserSession;
};
