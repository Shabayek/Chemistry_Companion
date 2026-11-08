import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGameStore } from '../../store/useGameStore';
import { MISSIONS, missionsByWorld, getMission } from '../../data/missions';
import { dailyStatus, localDateKey } from '../../game/engine/daily';
import { allMissedQuestions } from '../../game/engine/remediation';
import { DEMO_VIDEO, GALLERY } from '../../data/media';
import { computeWorldCompletion } from '../../game/engine/progress';

const WORLD_META: Record<string, { emoji: string; desc: string; color: string }> = {
  beginner: { emoji: '🌱', desc: 'Atoms, symbols, states, simple molecules & physical vs chemical change', color: 'from-green-400 to-emerald-600' },
  intermediate: { emoji: '🔬', desc: 'Periodic table, bonds, formulas, equations, solutions & pH', color: 'from-blue-400 to-indigo-600' },
  advanced: { emoji: '⚛️', desc: 'Moles, reactions, gas laws, redox, organics, polymers & biomolecules', color: 'from-purple-400 to-pink-600' },
  expert: { emoji: '🏆', desc: 'Equilibrium, buffers, thermo, kinetics, electrochemistry, orbitals & nuclear', color: 'from-amber-400 to-red-600' },
};

export default function Home() {
  const progress = useGameStore((s) => s.progress);
  // Read the date once per visit (calling Date during every render would be impure).
  const [today] = useState(() => localDateKey(new Date()));
  const daily = dailyStatus(progress, today, MISSIONS);
  const dailyMission = daily.missionId ? getMission(daily.missionId) : undefined;
  const mistakes = allMissedQuestions(progress, MISSIONS).length;
  return (
    <div className="space-y-6">
      <section className="card text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-gradient">Chemistry Companion</h1>
        <p className="text-muted mt-2">Learn chemistry from scratch — play, experiment, and master every level.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link to="/review" className="btn btn-ghost">📝 Review mistakes{mistakes > 0 ? ` (${mistakes})` : ''}</Link>
          <Link to="/settings" className="btn btn-ghost">Settings</Link>
          <Link to="/profile" className="btn btn-ghost">Profile</Link>
        </div>
      </section>

      <section className="card flex flex-wrap items-center gap-4" aria-labelledby="showcase-heading" data-testid="showcase-card">
        <Link to="/showcase#demo" className="shrink-0 rounded-lg overflow-hidden border border-[var(--card-border)] focus-ring" aria-label="Watch the demo video">
          <img src={`${import.meta.env.BASE_URL}${DEMO_VIDEO.poster}`} alt="" className="w-48 aspect-video object-cover" />
        </Link>
        <div className="flex-1 min-w-[220px] space-y-2">
          <h2 id="showcase-heading" className="font-bold">🎬 See it in action</h2>
          <p className="text-sm text-muted">A short captioned tour of the game, and screenshots of every major screen.</p>
          <div className="flex flex-wrap gap-2">
            <Link to="/showcase#demo" className="btn btn-primary !py-1.5 !px-3 text-sm">▶ Watch the demo video</Link>
            <Link to="/showcase#gallery" className="btn btn-ghost !py-1.5 !px-3 text-sm">🖼 Photo gallery ({GALLERY.length})</Link>
          </div>
        </div>
      </section>

      {dailyMission && (
        <section className="card space-y-2" aria-labelledby="daily-heading" data-testid="daily-card">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="daily-heading" className="font-bold">📅 Daily Challenge</h2>
            <span className="text-sm text-amber-300 ml-auto" data-testid="daily-streak">🔥 {daily.streak}-day streak</span>
          </div>
          <p><strong>{dailyMission.title}</strong> <span className="text-sm text-muted capitalize">· {dailyMission.world}</span></p>
          <p className="text-sm text-muted">{dailyMission.concept}</p>
          {daily.done ? (
            <p className="text-green-400 font-semibold" role="status">✓ Done for today! Come back tomorrow to keep your streak.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <Link to={`/mission/${dailyMission.id}`} className="btn btn-primary">Play today's challenge</Link>
              <span className="text-sm">Bonus: <strong>+{daily.bonus} Atoms</strong> (grows with your streak)</span>
            </div>
          )}
        </section>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-label="Worlds">
        {(['beginner', 'intermediate', 'advanced', 'expert'] as const).map((w) => {
          const unlocked = progress.unlockedWorlds.includes(w);
          const ids = missionsByWorld(w).map((m) => m.id);
          const comp = computeWorldCompletion(progress, ids);
          const meta = WORLD_META[w]!;
          const body = (
            <>
              <div className={`h-2 rounded-full bg-gradient-to-r ${meta.color} mb-3`} />
              <div className="flex items-center gap-3">
                <span className="text-4xl" aria-hidden>{meta.emoji}</span>
                <div className="flex-1">
                  <h2 className="text-xl font-bold capitalize">{w}</h2>
                  <p className="text-sm text-muted">{meta.desc}</p>
                </div>
                {unlocked ? <span className="text-xs text-muted">{comp}%</span> : <span role="img" aria-label="Locked">🔒</span>}
              </div>
              <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${meta.color}`} style={{ width: `${comp}%` }} />
              </div>
              {!unlocked && <p className="text-xs text-muted mt-2">Complete 80% of the previous world to unlock.</p>}
            </>
          );
          return unlocked
            ? <Link key={w} to={`/world/${w}`} className="card block transition hover:scale-[1.02]" data-testid={`world-${w}`}>{body}</Link>
            : <div key={w} className="card block border-dashed" aria-disabled="true" data-testid={`world-${w}`}>{body}</div>;
        })}
      </section>
    </div>
  );
}
