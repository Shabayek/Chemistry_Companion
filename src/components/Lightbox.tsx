import { useEffect, useRef, type KeyboardEvent } from 'react';

export interface LightboxProps {
  src: string;
  alt: string;
  title: string;
  caption: string;
  position: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

/**
 * Modal image viewer: focus moves to the close button and is trapped inside; Escape closes;
 * ← / → move between images. The caller restores focus to the thumbnail on close.
 */
export function Lightbox({ src, alt, title, caption, position, onClose, onPrev, onNext }: LightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => { closeRef.current?.focus(); }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); onNext(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); onPrev(); }
    else if (e.key === 'Tab') {
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button, a[href]');
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lightbox-title"
        aria-describedby="lightbox-caption"
        className="card max-w-6xl w-full max-h-full overflow-auto space-y-3"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-2">
          <h2 id="lightbox-title" className="font-bold">{title}</h2>
          <span className="text-xs text-muted">{position}</span>
          <div className="ml-auto flex gap-2">
            <button type="button" className="btn btn-ghost !py-1 !px-3 text-sm" onClick={onPrev}>← Previous</button>
            <button type="button" className="btn btn-ghost !py-1 !px-3 text-sm" onClick={onNext}>Next →</button>
            <a className="btn btn-ghost !py-1 !px-3 text-sm" href={src} target="_blank" rel="noreferrer">Full size</a>
            <button ref={closeRef} type="button" className="btn btn-primary !py-1 !px-3 text-sm" onClick={onClose}>✕ Close</button>
          </div>
        </div>
        <img src={src} alt={alt} className="w-full h-auto rounded-lg border border-[var(--card-border)] max-h-[70vh] object-contain" />
        <p id="lightbox-caption" className="text-sm">{caption}</p>
      </div>
    </div>
  );
}
