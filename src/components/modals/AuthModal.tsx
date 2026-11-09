import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { JumbyLogo } from '@/components/brand/JumbyLogo';
import { JumbyCoin } from '@/components/brand/JumbyCoin';
import {
  X,
  User,
  Lock,
  Mail,
  Sparkles,
  LogOut,
  CheckCircle,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Trophy,
  Play,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'claim' | 'login';
}

export function AuthModal({ isOpen, onClose, defaultMode = 'claim' }: AuthModalProps) {
  const { user, login, register, logout } = useAuth();
  const { coins } = useWallet();

  const [mode, setMode] = useState<'claim' | 'login'>(defaultMode);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [userScores, setUserScores] = useState<
    { gameId: string; title: string; slug: string; score: number; thumbnailUrl: string | null }[]
  >([]);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/scores/user')
        .then((res) => (res.ok ? res.json() : null))
        .then((data: any) => {
          if (data?.scores && Array.isArray(data.scores)) {
            setUserScores(data.scores);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'claim') {
        const res = await register(username, password, email, displayName);
        if (res.success) {
          setSuccessMessage('Profile secured! Welcome to Jumby Creators.');
          setTimeout(() => {
            onClose();
            setSuccessMessage(null);
          }, 1200);
        } else {
          setError(res.error || 'Failed to claim account');
        }
      } else {
        const res = await login(username, password);
        if (res.success) {
          setSuccessMessage('Logged in successfully!');
          setTimeout(() => {
            onClose();
            setSuccessMessage(null);
          }, 1200);
        } else {
          setError(res.error || 'Invalid username or password');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsSubmitting(true);
    await logout();
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#16132b] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/50 text-white overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-jumby-purple/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-jumby-lime/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* User is already authenticated and NOT a guest */}
        {user && !user.isGuest ? (
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-jumby-purple to-jumby-lime p-1 shadow-lg mb-4">
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="w-full h-full rounded-full bg-zinc-900 object-cover"
              />
            </div>

            <h3 className="text-xl font-heading font-black text-white">{user.displayName}</h3>
            <p className="text-sm text-zinc-400 mb-4">@{user.username}</p>

            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
              <JumbyCoin size="sm" />
              <span className="font-heading font-black text-sm text-yellow-400">
                {coins.toLocaleString()} Coins
              </span>
              <span className="text-xs text-zinc-500">• Permanent Account</span>
            </div>

            {/* My High Scores / Trophies Showcase */}
            <div className="w-full text-left mb-6">
              <div className="flex items-center gap-1.5 text-xs font-heading font-black text-zinc-300 mb-2.5">
                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                <span>My High Scores ({userScores.length})</span>
              </div>

              {userScores.length === 0 ? (
                <div className="p-4 rounded-2xl bg-black/20 border border-white/5 text-center text-xs text-zinc-500 font-sans">
                  No personal bests recorded yet. Play games to earn trophies!
                </div>
              ) : (
                <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                  {userScores.map((scoreItem) => (
                    <div
                      key={scoreItem.gameId}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-jumby-purple/20 flex items-center justify-center text-xs shrink-0">
                          🎮
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{scoreItem.title}</div>
                          <div className="text-[10px] text-zinc-400 font-mono">Personal Best</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-heading font-black text-xs text-jumby-lime">
                          {scoreItem.score.toLocaleString()}
                        </span>
                        <a
                          href={`/g/${scoreItem.slug}`}
                          className="w-6 h-6 rounded-full bg-white/10 hover:bg-jumby-purple flex items-center justify-center text-white transition"
                          title="Play again"
                        >
                          <Play className="w-3 h-3 fill-current ml-0.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="w-full space-y-3">
              <button
                onClick={handleLogout}
                disabled={isSubmitting}
                className="w-full py-3 rounded-2xl bg-white/5 hover:bg-red-500/20 text-zinc-300 hover:text-red-300 border border-white/10 flex items-center justify-center gap-2 font-medium text-sm transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* Guest or Sign In / Claim Form */
          <div>
            <div className="flex items-center gap-3 mb-6">
              <JumbyLogo size="sm" />
              <div className="h-4 w-px bg-white/15" />
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold">
                <Sparkles className="w-3 h-3 text-jumby-lime" />
                <span>Creator Profile</span>
              </div>
            </div>

            {/* Mode Tabs */}
            <div className="flex rounded-xl bg-black/40 p-1 mb-6 border border-white/5">
              <button
                type="button"
                onClick={() => {
                  setMode('claim');
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                  mode === 'claim'
                    ? 'bg-gradient-to-r from-jumby-purple to-[#8374ff] text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {user?.isGuest ? 'Claim Profile' : 'Sign Up'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-jumby-purple to-[#8374ff] text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
            </div>

            {/* Guest Perks Banner */}
            {mode === 'claim' && user?.isGuest && (
              <div className="mb-5 p-3 rounded-2xl bg-purple-950/40 border border-purple-500/20 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-jumby-lime shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-300 leading-relaxed">
                  You are currently playing as <strong className="text-white">@{user.username}</strong>. Claiming your profile keeps all your published games and coins!
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/50 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-200">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'claim' && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                    Display Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pixel Ninja"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-jumby-purple transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Username {mode === 'login' && 'or Email'}
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    placeholder={mode === 'claim' ? 'e.g. pixelninja' : 'username or email'}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-jumby-purple transition"
                  />
                </div>
              </div>

              {mode === 'claim' && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                    Email <span className="text-zinc-600 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-jumby-purple transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-jumby-purple transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-jumby-purple to-[#8374ff] hover:brightness-110 text-white font-heading font-black text-sm shadow-lg shadow-jumby-purple/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : mode === 'claim' ? (
                  <span>Claim Profile & Save Progress</span>
                ) : (
                  <span>Sign In to Account</span>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
