export const APP_NAME = 'Chemistry Companion';

const STATIC_TITLES: Record<string, string> = {
  '/': 'Home',
  '/lab': 'Lab',
  '/periodic-table': 'Periodic Table',
  '/molecules': 'Molecules',
  '/collection': 'Collection',
  '/profile': 'Profile',
  '/settings': 'Settings',
  '/review': 'Mistakes Review',
  '/showcase': 'See it in action',
};

/**
 * Document title for a route, e.g. "/world/expert" -> "Expert World · Chemistry Companion".
 * Mission pages pass their own title (kept out of here so the mission data is not in the main bundle).
 */
export function titleFor(pathname: string, pageTitle?: string): string {
  const path = pathname.replace(/\/+$/, '') || '/';
  let page = pageTitle ?? STATIC_TITLES[path];
  const world = /^\/world\/([a-z]+)$/.exec(path);
  if (!page && world) page = `${world[1]!.charAt(0).toUpperCase()}${world[1]!.slice(1)} World`;
  if (!page && path.startsWith('/mission/')) page = 'Mission';
  return page ? `${page} · ${APP_NAME}` : APP_NAME;
}
