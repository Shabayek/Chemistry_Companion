/**
 * Showcase media in public/media/ (regenerate with `node scripts/capture-media.mjs`).
 * Paths are relative to the site root; prefix with import.meta.env.BASE_URL when rendering.
 */
export interface GalleryItem {
  id: string;
  title: string;
  caption: string;
  /** Describes the screenshot for screen-reader users. */
  alt: string;
  /** Phone-sized (portrait) screenshot. */
  portrait?: boolean;
}

export const DEMO_VIDEO = {
  webm: 'media/demo.webm',
  mp4: 'media/demo.mp4',
  poster: 'media/demo-poster.webp',
  captions: 'media/demo.vtt',
} as const;

export const GALLERY: GalleryItem[] = [
  { id: 'home', title: 'Home', caption: 'Four worlds, the Daily Challenge with its streak, and a shortcut to your mistakes.', alt: 'Home page with the Daily Challenge card and the four world cards with progress bars.' },
  { id: 'world-map', title: 'World map', caption: 'Each world: 7 core missions, a timed mini-boss, a final boss and a Clinic, with progress toward the 80% unlock.', alt: 'Beginner world map showing mission cards with stars, a mini-boss, a final boss and a progress bar.' },
  { id: 'periodic-table', title: 'Periodic table', caption: 'All 118 elements in the standard layout, with a detail card for each.', alt: 'Periodic table coloured by category with the iron detail card open.' },
  { id: 'periodic-trends', title: 'Periodic trends', caption: 'Colour the table by electronegativity or atomic mass to see trends.', alt: 'Periodic table coloured from blue to red by electronegativity, with a legend.' },
  { id: 'lab-builder', title: 'Molecule Builder', caption: 'Build any of the 60 molecules; same atoms, different molecules are explained as isomers.', alt: 'Lab molecule builder with six carbon, ten hydrogen and five oxygen atoms recognised as starch and cellulose.' },
  { id: 'mix-bench', title: 'Mix bench', caption: '19 balanced reactions; collect the products you make.', alt: 'Mix bench showing copper sulfate and sodium hydroxide forming a copper hydroxide precipitate.' },
  { id: 'boss-quiz', title: 'Final boss', caption: 'Final bosses have several stages and 3 lives; every answer is explained.', alt: 'Boss quiz question with the right answer highlighted, the wrong pick marked, and two of three hearts left.' },
  { id: 'orbitals', title: 'Orbital Architect', caption: 'Build electron configurations with orbital boxes, including exceptions such as chromium.', alt: 'Electron configuration builder for chromium with an explanation that chromium is an exception.' },
  { id: 'polymers', title: 'Polymer Workshop', caption: 'Chain builder and questions about monomers, polymer types and recycling codes.', alt: 'Polymer chain builder showing five polyethylene repeat units and polymer questions.' },
  { id: 'collection', title: 'Collection', caption: 'Track 118 elements, 60 molecules and badges; locked slots hint at what is left.', alt: 'Collection page with element and molecule totals, progress bars and the periodic table of collected elements.' },
  { id: 'molecules', title: 'Molecule explorer', caption: 'Every molecule with formula, molar mass, composition and uses, and links to build or make it.', alt: 'Molecule explorer with the caffeine detail card showing composition by mass.' },
  { id: 'review', title: 'Mistakes Review', caption: 'Every question you missed, with the right answer, explanation and a link to the Clinic.', alt: 'Mistakes Review page listing three missed intermediate questions with answers.' },
  { id: 'mobile', title: 'On a phone', caption: 'Responsive layout with a menu on small screens.', alt: 'World map on a phone-sized screen with the navigation menu open.', portrait: true },
];

export const galleryImage = (item: GalleryItem) => `media/gallery/${item.id}.webp`;
export const galleryThumb = (item: GalleryItem) => `media/gallery/${item.id}-thumb.webp`;
