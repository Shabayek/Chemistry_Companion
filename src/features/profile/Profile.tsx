import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGameStore } from '../../store/useGameStore';

export default function Profile() {
  const progress = useGameStore((s) => s.progress);
  const reset = useGameStore((s) => s.reset);
  const exportJson = useGameStore((s) => s.exportJson);
  const importJson = useGameStore((s) => s.importJson);
  const [importText, setImportText] = useState('');
  const [msg, setMsg] = useState('');

  const handleExport = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'chemistry-companion-save.json'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Profile</h1>
      <div className="card space-y-2">
        <p><strong>Name:</strong> {progress.playerName}</p>
        <p><strong>Currency:</strong> {progress.currency} Atoms</p>
        <p><strong>Unlocked worlds:</strong> {progress.unlockedWorlds.join(', ')}</p>
        <p><strong>Missions completed:</strong> {Object.values(progress.missions).filter((m) => m.completed).length}</p>
        <p><strong>Daily streak:</strong> {progress.streakDays > 0 && progress.dailyChallengeDate ? `${progress.streakDays} day${progress.streakDays === 1 ? '' : 's'} (last: ${progress.dailyChallengeDate})` : 'none yet'}</p>
        <p><Link to="/review">📝 Review your mistakes</Link></p>
      </div>
      <div className="card space-y-2">
        <h2 className="font-bold">Save / Load</h2>
        <div className="flex gap-2 flex-wrap">
          <button className="btn btn-primary" onClick={handleExport}>Export JSON</button>
          <button className="btn btn-danger" onClick={() => { if (confirm('Reset all progress?')) reset(); }}>Reset</button>
        </div>
        <label htmlFor="import-save" className="block text-sm text-muted">Import a save (paste exported JSON)</label>
        <textarea id="import-save" value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Paste save JSON here" rows={4} className="w-full" />
        <button className="btn btn-ghost" onClick={() => { setMsg(importJson(importText) ? 'Imported!' : 'Invalid JSON'); }}>Import</button>
        <p className="text-sm" role="status">{msg}</p>
      </div>
    </div>
  );
}