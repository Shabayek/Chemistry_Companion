import { useParams, Link } from 'react-router-dom';
import { useGameStore } from '../../store/useGameStore';
import { missionsByWorld } from '../../data/missions';
import { worldOrder, UNLOCK_THRESHOLD_PERCENT } from '../../game/engine/progress';
import { missionAvailability, worldSummary, worldLabel } from '../../game/engine/worlds';
import { isRemediationRecommended } from '../../game/engine/remediation';
import { KIND_LABELS } from '../mission/labels';
import type { Difficulty, Mission } from '../../types';

export default function World() {
  const { difficulty } = useParams<{ difficulty: string }>();
  const world: Difficulty = (worldOrder() as string[]).includes(difficulty ?? '') ? (difficulty as Difficulty) : 'beginner';
  const progress = useGameStore((s) => s.progress);
  const missions = missionsByWorld(world);
  const zones = Array.from(new Set(missions.map((m) => m.zone)));
  const summary = worldSummary(progress, world, missions);
  const worldLocked = !progress.unlockedWorlds.includes(world);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/" className="btn btn-ghost !py-1.5 !px-3">← Back</Link>
        <h1 className="text-2xl font-bold capitalize">{world} World</h1>
      </div>

      <section className="card space-y-2" aria-label="World progress">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold" data-testid="world-progress">{summary.completed} / {summary.total} missions completed ({summary.percent}%)</span>
          <span className="text-muted ml-auto" data-testid="unlock-status">
            {summary.next === null
              ? 'Final world'
              : summary.nextUnlocked
                ? `✓ ${worldLabel(summary.next)} unlocked`
                : `Complete ${summary.neededForUnlock} of ${summary.total} (${UNLOCK_THRESHOLD_PERCENT}%) to unlock ${worldLabel(summary.next)}`}
          </span>
        </div>
        <div className="relative h-2.5 bg-white/10 rounded-full" role="progressbar" aria-label="World completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={summary.percent}>
          <div className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]" style={{ width: `${summary.percent}%` }} />
          {summary.next && <span aria-hidden className="absolute -top-1 h-4.5 w-0.5 bg-amber-300" style={{ left: `${UNLOCK_THRESHOLD_PERCENT}%` }} title="Unlock threshold" />}
        </div>
        {worldLocked && <p className="text-sm text-amber-300">🔒 This world is locked. Reach {UNLOCK_THRESHOLD_PERCENT}% in the previous world first.</p>}
      </section>

      {zones.map((zone) => (
        <section key={zone} className="card" aria-labelledby={`zone-${zone}`}>
          <h2 id={`zone-${zone}`} className="font-bold mb-3">{zone}</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {missions.filter((m) => m.zone === zone).map((m) => <MissionCard key={m.id} mission={m} worldMissions={missions} />)}
          </ul>
        </section>
      ))}
    </div>
  );
}

function MissionCard({ mission: m, worldMissions }: { mission: Mission; worldMissions: Mission[] }) {
  const progress = useGameStore((s) => s.progress);
  const mp = progress.missions[m.id];
  const stars = mp?.stars ?? 0;
  const availability = missionAvailability(progress, m, worldMissions);
  const recommended = isRemediationRecommended(progress, m);
  const accent = m.kind === 'boss' ? 'border-amber-300/70' : m.kind === 'miniboss' ? 'border-orange-400/60' : m.kind === 'remediation' ? 'border-teal-300/60' : '';

  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">{m.title}</span>
        {m.kind === 'boss' && <span role="img" aria-label="Boss mission">👑</span>}
        {m.kind === 'miniboss' && <span role="img" aria-label="Mini-boss mission">⚔️</span>}
        {m.kind === 'remediation' && <span role="img" aria-label="Clinic mission">🩺</span>}
      </div>
      {m.kind !== 'core' && <p className="text-[11px] uppercase tracking-wide text-muted mt-0.5">{KIND_LABELS[m.kind]}</p>}
      <p className="text-xs text-muted mt-1">{m.concept}</p>
      {availability.locked ? (
        <p className="text-xs mt-2 text-amber-300" data-testid="lock-reason">🔒 {availability.reason}</p>
      ) : (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span role="img" className="text-amber-300" aria-label={`${stars} of 3 stars`}>{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</span>
          {mp?.completed && <span className="text-xs text-green-400">Completed</span>}
          {recommended && <span className="text-xs px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-200" data-testid="recommended">Recommended</span>}
        </div>
      )}
    </>
  );

  return (
    <li>
      {availability.locked ? (
        <div className={`glass p-4 block opacity-60 border ${accent}`} aria-disabled="true" data-testid={`mission-card-${m.id}`}>{body}</div>
      ) : (
        <Link to={`/mission/${m.id}`} className={`glass p-4 block hover:scale-[1.02] transition border ${accent}`} data-testid={`mission-card-${m.id}`}>{body}</Link>
      )}
    </li>
  );
}
