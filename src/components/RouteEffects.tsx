import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { titleFor } from '../lib/titles';

/**
 * On every navigation: set the document title, and (after the first page) move focus to the main region so
 * keyboard and screen-reader users start at the new page's content.
 */
export function RouteEffects() {
  const { pathname } = useLocation();
  // Compare with the previous path (not a "first run" flag): StrictMode runs effects twice in development.
  const previous = useRef(pathname);
  useEffect(() => {
    document.title = titleFor(pathname);
    if (previous.current === pathname) return;
    previous.current = pathname;
    document.getElementById('main')?.focus({ preventScroll: false });
  }, [pathname]);
  return null;
}
