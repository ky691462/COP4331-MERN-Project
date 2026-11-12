import type { Theme } from '../lib/api';

// Word theme choice shown as tiles. Holiday themes are listed separately and
// the one that's in season is marked.
function ThemePicker({ themes, value, onChange, disabled = false, name = 'theme' }: {
  themes: Theme[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  name?: string;
}) {
  const general = themes.filter((t) => t.kind !== 'holiday');
  const holidays = [...themes.filter((t) => t.kind === 'holiday')]
    .sort((a, b) => Number(b.inSeason) - Number(a.inSeason));

  const option = (t: Theme) => (
    <label key={t.id} className={`theme-opt ${value === t.id ? 'is-on' : ''}`}>
      <input type="radio" name={name} value={t.id} checked={value === t.id}
        disabled={disabled} onChange={() => onChange(t.id)} />
      <span className="theme-emoji" aria-hidden="true">{t.emoji}</span>
      <span className="theme-name">{t.name}</span>
      {t.inSeason && <span className="theme-badge">In season</span>}
    </label>
  );

  return (
    <fieldset className="theme-picker" disabled={disabled}>
      <legend>Word theme</legend>
      <div className="theme-grid">{general.map(option)}</div>
      {holidays.length > 0 && (
        <>
          <p className="theme-sub">Holidays <span>(the whole game dresses up)</span></p>
          <div className="theme-grid">{holidays.map(option)}</div>
        </>
      )}
    </fieldset>
  );
}

export default ThemePicker;
