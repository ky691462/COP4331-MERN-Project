import { useEffect } from 'react';

// Holiday word themes also restyle the app: the "game table" changes color
// and a few faint holiday icons float in the background. Everything else
// (tiles, cards, the pink impostor, light/dark mode) stays the same.
export const HOLIDAY_DECOR: Record<string, string[]> = {
  halloween: ['🎃', '🦇', '👻', '🕸️'],
  thanksgiving: ['🍂', '🦃', '🥧', '🌽'],
  'winter-holidays': ['❄️', '🎄', '🎁', '⛄'],
  valentines: ['💘', '🌹', '💌', '🍫'],
  'fourth-of-july': ['🎆', '⭐', '🎇', '🇺🇸'],
};

export function isHoliday(themeId?: string | null): boolean {
  return !!themeId && themeId in HOLIDAY_DECOR;
}

export function applyHoliday(themeId?: string | null): void {
  const root = document.documentElement;
  if (isHoliday(themeId)) root.dataset.holiday = themeId!;
  else delete root.dataset.holiday;
}

// Apply a holiday skin while a page is showing; remove it when the page closes.
export function useHoliday(themeId?: string | null): void {
  useEffect(() => {
    applyHoliday(themeId);
    return () => applyHoliday(null);
  }, [themeId]);
}
