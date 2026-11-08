import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { DEMO_VIDEO, GALLERY, galleryImage, galleryThumb } from '../../data/media';
import { parseVtt, clock, type Cue } from '../../lib/vtt';
import { Lightbox } from '../../components/Lightbox';

const url = (path: string) => `${import.meta.env.BASE_URL}${path}`;

/** Demo video (with captions and a clickable transcript) and a screenshot gallery with a lightbox. */
export default function Showcase() {
  const { hash } = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cues, setCues] = useState<Cue[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    let active = true;
    fetch(url(DEMO_VIDEO.captions))
      .then((r) => (r.ok ? r.text() : ''))
      .then((t) => { if (active) setCues(parseVtt(t)); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // Deep links: /showcase#demo and /showcase#gallery.
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  const seek = (t: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = t;
    void v.play().catch(() => {});
  };

  const close = () => {
    const i = open;
    setOpen(null);
    if (i !== null) thumbs.current[i]?.focus();
  };
  const item = open !== null ? GALLERY[open] : undefined;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">See it in action</h1>

      <section id="demo" className="card space-y-3 scroll-mt-24" aria-labelledby="demo-heading">
        <h2 id="demo-heading" className="font-bold">▶ Demo video</h2>
        <video
          ref={videoRef}
          controls
          preload="metadata"
          poster={url(DEMO_VIDEO.poster)}
          className="w-full rounded-lg border border-[var(--card-border)] bg-black"
          aria-describedby="demo-desc"
          data-testid="demo-video"
        >
          <source src={url(DEMO_VIDEO.webm)} type="video/webm" />
          <source src={url(DEMO_VIDEO.mp4)} type="video/mp4" />
          <track kind="captions" src={url(DEMO_VIDEO.captions)} srcLang="en" label="English" default />
          Your browser cannot play this video. <a href={url(DEMO_VIDEO.mp4)}>Download the MP4</a>.
        </video>
        <p id="demo-desc" className="text-sm text-muted">
          A guided tour: the periodic table, the Lab, a final boss, electron configurations, the Daily Challenge,
          the Collection and the Mistakes Review. Captions are on by default.
        </p>
        {cues.length > 0 && (
          <details className="glass p-3">
            <summary className="cursor-pointer text-sm font-semibold">Transcript and chapters</summary>
            <ol className="mt-2 space-y-1 text-sm" aria-label="Chapters">
              {cues.map((c) => (
                <li key={c.start}>
                  <button type="button" className="text-left underline decoration-dotted hover:text-[var(--accent)] focus-ring" onClick={() => seek(c.start)}>
                    <span className="font-mono text-muted">{clock(c.start)}</span> {c.text}
                  </button>
                </li>
              ))}
            </ol>
          </details>
        )}
      </section>

      <section id="gallery" className="card space-y-3 scroll-mt-24" aria-labelledby="gallery-heading">
        <h2 id="gallery-heading" className="font-bold">🖼 Photo gallery</h2>
        <p className="text-sm text-muted">{GALLERY.length} screenshots. Select one to enlarge; use ← and → to browse.</p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {GALLERY.map((g, i) => (
            <li key={g.id}>
              <button
                ref={(el) => { thumbs.current[i] = el; }}
                type="button"
                className="glass w-full p-2 text-left hover:scale-[1.02] transition focus-ring"
                onClick={() => setOpen(i)}
                aria-haspopup="dialog"
              >
                <img src={url(galleryThumb(g))} alt={g.alt} loading="lazy" className={`w-full rounded-md ${g.portrait ? 'h-[270px] object-contain' : 'aspect-[16/10] object-cover'}`} />
                <span className="block font-semibold mt-2">{g.title}</span>
                <span className="block text-xs text-muted">{g.caption}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {item && open !== null && (
        <Lightbox
          src={url(galleryImage(item))}
          alt={item.alt}
          title={item.title}
          caption={item.caption}
          position={`${open + 1} / ${GALLERY.length}`}
          onClose={close}
          onPrev={() => setOpen((open - 1 + GALLERY.length) % GALLERY.length)}
          onNext={() => setOpen((open + 1) % GALLERY.length)}
        />
      )}
    </div>
  );
}
