import { useGameStore } from '../../store/useGameStore';

export default function Settings() {
  const progress = useGameStore((s) => s.progress);
  const setTheme = useGameStore((s) => s.setTheme);
  const setAgeMode = useGameStore((s) => s.setAgeMode);
  const setSettings = useGameStore((s) => s.setSettings);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="card space-y-3">
        <label className="block">Theme:
          <select value={progress.theme} onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'high-contrast')} className="ml-2">
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="high-contrast">High contrast</option>
          </select>
        </label>
        <div>
          <label className="block">Age mode:
            <select value={progress.ageMode} onChange={(e) => setAgeMode(e.target.value as 'kid' | 'standard')} className="ml-2" aria-describedby="age-mode-help">
              <option value="standard">Standard</option>
              <option value="kid">Kid (extra help)</option>
            </select>
          </label>
          <p id="age-mode-help" className="text-xs text-muted mt-1">
            Kid mode adds quiz hints that remove a wrong answer, an extra life in final bosses, 50% more time in
            mini-bosses, and friendlier messages.
          </p>
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={progress.settings.audio} onChange={(e) => setSettings({ audio: e.target.checked })} />
          Sound effects
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={progress.settings.reducedMotion} onChange={(e) => setSettings({ reducedMotion: e.target.checked })} />
          Reduced motion
        </label>
        <label className="block">Text size:
          <select value={progress.settings.textSize} onChange={(e) => setSettings({ textSize: e.target.value as 'sm' | 'md' | 'lg' })} className="ml-2">
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
          </select>
        </label>
      </div>
    </div>
  );
}