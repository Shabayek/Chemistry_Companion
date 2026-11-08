/**
 * Small synthesized sound effects (Web Audio, no audio files). Every function is a no-op when sound is
 * disabled or Web Audio is unavailable. Each call also dispatches a `cc:sound` event on window so tests can
 * observe which sound played.
 */
export type SoundName = 'correct' | 'wrong' | 'complete' | 'fail' | 'collect' | 'bonus';

type Note = { freq: number; start: number; duration: number; type?: OscillatorType };

const SOUNDS: Record<SoundName, Note[]> = {
  correct: [{ freq: 660, start: 0, duration: 0.09 }, { freq: 880, start: 0.09, duration: 0.12 }],
  wrong: [{ freq: 196, start: 0, duration: 0.18, type: 'square' }],
  complete: [523, 659, 784, 1047].map((freq, i) => ({ freq, start: i * 0.11, duration: 0.16 })),
  fail: [{ freq: 392, start: 0, duration: 0.16 }, { freq: 311, start: 0.16, duration: 0.24 }],
  collect: [{ freq: 988, start: 0, duration: 0.07 }, { freq: 1319, start: 0.07, duration: 0.1 }],
  bonus: [784, 988, 1175, 1568].map((freq, i) => ({ freq, start: i * 0.08, duration: 0.12, type: 'triangle' as const })),
};

let ctx: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor = (globalThis as { AudioContext?: typeof AudioContext }).AudioContext
    ?? (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
  } catch {
    return null;
  }
  return ctx;
}

/** Play a sound if `enabled`. Returns true when something was scheduled. */
export function playSound(name: SoundName, enabled: boolean): boolean {
  if (!enabled) return false;
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('cc:sound', { detail: name }));
  const ac = audioContext();
  if (!ac) return false;
  if (ac.state === 'suspended') void ac.resume();
  const t0 = ac.currentTime;
  for (const n of SOUNDS[name]) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = n.type ?? 'sine';
    osc.frequency.value = n.freq;
    gain.gain.setValueAtTime(0.0001, t0 + n.start);
    gain.gain.exponentialRampToValueAtTime(0.12, t0 + n.start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + n.start + n.duration);
    osc.connect(gain).connect(ac.destination);
    osc.start(t0 + n.start);
    osc.stop(t0 + n.start + n.duration + 0.02);
  }
  return true;
}

/** For tests: forget the cached AudioContext. */
export function resetSoundForTests(): void {
  ctx = null;
}
