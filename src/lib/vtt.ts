export interface Cue {
  start: number;
  end: number;
  text: string;
}

function seconds(ts: string): number {
  const parts = ts.trim().split(':').map(Number);
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

/** Minimal WebVTT parser (timings + text), enough for a transcript. */
export function parseVtt(text: string): Cue[] {
  const cues: Cue[] = [];
  for (const block of text.replace(/\r/g, '').split(/\n{2,}/)) {
    const lines = block.split('\n').filter(Boolean);
    const timing = lines.findIndex((l) => l.includes('-->'));
    if (timing < 0) continue;
    const [a, b] = lines[timing]!.split('-->');
    cues.push({ start: seconds(a!), end: seconds(b!.split(' ').filter(Boolean)[0]!), text: lines.slice(timing + 1).join(' ') });
  }
  return cues;
}

/** "83.4" -> "1:23" */
export function clock(s: number): string {
  const t = Math.floor(s);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}
