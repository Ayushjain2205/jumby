// Lightweight Web Audio API synthesizer for Friv-style micro-interactions

let audioCtx: AudioContext | null = null;
let lastSoundTime = 0;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Crisp, subtle arcade hover blip reminiscent of classic Friv tile hovers
 */
export function playFrivTileHover(): void {
  try {
    const now = Date.now();
    // Throttle to prevent audio overload during fast mouse sweeps across grid
    if (now - lastSoundTime < 45) return;
    lastSoundTime = now;

    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const startTime = ctx.currentTime;
    const duration = 0.035; // 35ms quick subtle blip

    // Gentle upward chirping frequency (700Hz -> 860Hz)
    osc.frequency.setValueAtTime(720, startTime);
    osc.frequency.exponentialRampToValueAtTime(880, startTime + duration);

    // Soft gentle volume curve so it's pleasant and non-fatiguing
    gain.gain.setValueAtTime(0.035, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  } catch {
    // Silently ignore if audio is blocked or unsupported
  }
}

/**
 * Punchy arcade click sound for launching a game
 */
export function playFrivGameLaunch(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    const startTime = ctx.currentTime;
    const duration = 0.09;

    osc.frequency.setValueAtTime(440, startTime);
    osc.frequency.exponentialRampToValueAtTime(880, startTime + duration);

    gain.gain.setValueAtTime(0.08, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  } catch {
    // Ignore audio policy errors
  }
}
