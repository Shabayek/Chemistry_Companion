import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';

const LINKS = [
  { to: '/periodic-table', label: 'Periodic' },
  { to: '/molecules', label: 'Molecules' },
  { to: '/lab', label: 'Lab' },
  { to: '/collection', label: 'Collection' },
  { to: '/profile', label: 'Profile' },
  { to: '/settings', label: 'Settings' },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `btn !py-1.5 !px-3 text-xs ${isActive ? 'btn-primary' : 'btn-ghost'}`;

/**
 * Top bar: inline navigation on wide screens, a disclosure menu on small screens.
 * NavLink sets aria-current="page" on the active link.
 */
export function TopBar() {
  const currency = useGameStore((s) => s.progress.currency);
  const playerName = useGameStore((s) => s.progress.playerName);
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);

  // Close the mobile menu after navigating (derived during render, no effect needed).
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 glass m-3 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg shrink-0" aria-label="Chemistry Companion home">
          <span className="text-2xl" aria-hidden>⚗️</span>
          <span className="hidden sm:inline text-gradient">Chemistry Companion</span>
        </Link>
        <nav aria-label="Main" className="hidden md:flex items-center gap-2 text-sm">
          {LINKS.map((l) => <NavLink key={l.to} to={l.to} className={linkClass}>{l.label}</NavLink>)}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span title="Atoms currency" className="flex items-center gap-1"><span aria-hidden>⚛️</span> <span className="sr-only">Atoms:</span>{currency}</span>
          <span className="hidden lg:inline text-muted">{playerName}</span>
          <button
            type="button"
            className="btn btn-ghost !py-1.5 !px-3 text-xs md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? '✕ Close' : '☰ Menu'}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Main" className="md:hidden mt-3 grid grid-cols-2 gap-2">
          {LINKS.map((l) => <NavLink key={l.to} to={l.to} className={linkClass}>{l.label}</NavLink>)}
        </nav>
      )}
    </header>
  );
}
