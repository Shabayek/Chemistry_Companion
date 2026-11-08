import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { existsSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import Showcase from '../src/features/showcase/Showcase';
import Home from '../src/features/home/Home';
import { DEMO_VIDEO, GALLERY, galleryImage, galleryThumb } from '../src/data/media';
import { parseVtt, clock } from '../src/lib/vtt';
import { useGameStore } from '../src/store/useGameStore';

const PUBLIC = join(__dirname, '..', 'public');

describe('media files', () => {
  it('every referenced file exists and is not empty', () => {
    const files = [...Object.values(DEMO_VIDEO), ...GALLERY.flatMap((g) => [galleryImage(g), galleryThumb(g)])];
    for (const f of files) {
      const path = join(PUBLIC, f);
      expect(existsSync(path), f).toBe(true);
      expect(statSync(path).size, f).toBeGreaterThan(1000);
    }
  });
  it('the captions file is valid WebVTT with ordered cues covering the video', () => {
    const text = readFileSync(join(PUBLIC, DEMO_VIDEO.captions), 'utf8');
    expect(text.startsWith('WEBVTT')).toBe(true);
    const cues = parseVtt(text);
    expect(cues.length).toBeGreaterThan(8);
    for (let i = 0; i < cues.length; i++) {
      expect(cues[i]!.end).toBeGreaterThan(cues[i]!.start);
      if (i > 0) expect(cues[i]!.start).toBeGreaterThanOrEqual(cues[i - 1]!.start);
    }
    expect(cues.at(-1)!.end).toBeGreaterThan(60);
  });
});

describe('vtt helpers', () => {
  it('parses cues and formats clocks', () => {
    const cues = parseVtt('WEBVTT\n\n1\n00:00:01.500 --> 00:00:04.000\nHello\n\n2\n00:01:05.000 --> 00:01:07.250 align:start\nSecond line\nwraps\n');
    expect(cues).toEqual([{ start: 1.5, end: 4, text: 'Hello' }, { start: 65, end: 67.25, text: 'Second line wraps' }]);
    expect(clock(83.4)).toBe('1:23');
    expect(clock(5)).toBe('0:05');
  });
});

describe('Showcase page', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('WEBVTT\n\n1\n00:00:00.000 --> 00:00:03.000\nIntro\n\n2\n00:00:03.000 --> 00:00:08.000\nPeriodic table\n')));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('renders the video with sources, captions and a transcript that seeks', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><Showcase /></MemoryRouter>);
    const video = screen.getByTestId('demo-video') as HTMLVideoElement;
    expect(video.querySelectorAll('source')).toHaveLength(2);
    expect(video.querySelector('track')).toHaveAttribute('kind', 'captions');
    const chapter = await screen.findByRole('button', { name: /0:03 Periodic table/ });
    video.play = vi.fn(async () => {});
    await user.click(screen.getByText('Transcript and chapters'));
    await user.click(chapter);
    expect(video.currentTime).toBe(3);
    expect(video.play).toHaveBeenCalled();
  });

  it('opens the lightbox, browses with arrows, traps Tab and restores focus on Escape', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><Showcase /></MemoryRouter>);
    const gallery = screen.getByRole('region', { name: /Photo gallery/ });
    const thumbs = within(gallery).getAllByRole('button');
    expect(thumbs).toHaveLength(GALLERY.length);
    await user.click(thumbs[1]!);
    const dialog = screen.getByRole('dialog', { name: GALLERY[1]!.title });
    expect(within(dialog).getByRole('button', { name: '✕ Close' })).toHaveFocus();
    expect(within(dialog).getByRole('img')).toHaveAttribute('alt', GALLERY[1]!.alt);
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('dialog', { name: GALLERY[2]!.title })).toHaveTextContent(`3 / ${GALLERY.length}`);
    await user.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}');
    expect(screen.getByRole('dialog', { name: GALLERY.at(-1)!.title })).toBeInTheDocument();
    await user.tab();
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: '← Previous' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(thumbs[GALLERY.length - 1]).toHaveFocus();
  });
});

describe('Home showcase card', () => {
  beforeEach(() => useGameStore.getState().reset());
  it('links to the demo video and the gallery', () => {
    render(<MemoryRouter><Home /></MemoryRouter>);
    const card = screen.getByTestId('showcase-card');
    expect(within(card).getByRole('link', { name: '▶ Watch the demo video' })).toHaveAttribute('href', '/showcase#demo');
    expect(within(card).getByRole('link', { name: `🖼 Photo gallery (${GALLERY.length})` })).toHaveAttribute('href', '/showcase#gallery');
  });
});
