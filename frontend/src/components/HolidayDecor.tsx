import { HOLIDAY_DECOR } from '../lib/holiday';

// Fixed positions (percent of the screen) so the icons never cover the panels'
// centers the same way twice and nothing jumps between renders.
const SPOTS = [
  [4, 12, -12], [90, 8, 10], [14, 46, 8], [82, 38, -8], [6, 82, 14],
  [94, 74, -14], [48, 92, 6], [62, 4, -6], [30, 6, 12], [72, 90, -10],
];

// Faint holiday icons behind the page. Decorative only (hidden from screen readers).
function HolidayDecor({ themeId }: { themeId?: string | null }) {
  const icons = themeId ? HOLIDAY_DECOR[themeId] : undefined;
  if (!icons) return null;
  return (
    <div className="holiday-decor" aria-hidden="true">
      {SPOTS.map(([x, y, r], i) => (
        <span key={i} style={{ left: `${x}%`, top: `${y}%`, transform: `rotate(${r}deg)` }}>
          {icons[i % icons.length]}
        </span>
      ))}
    </div>
  );
}

export default HolidayDecor;
