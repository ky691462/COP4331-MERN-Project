import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useApp } from '@/lib/app-context';
import type { Theme } from '@/lib/api';
import { PASSWORD_RULES } from '@/lib/password';
import { Btn, Lifted, Panel, T, Wordmark } from './ui';

// Top bar for logged-in screens: logo, light/dark toggle, extra actions, log out.
export function TopBar({ actions }: { actions?: ReactNode }) {
  const { mode, toggleMode, signOut } = useApp();
  return (
    <View style={{ marginBottom: 22, gap: 14 }}>
      <Wordmark size={17} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Btn kind="ghost" label={mode === 'dark' ? '☀ Light' : '☾ Dark'}
          accessibilityLabel={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`} onPress={toggleMode} />
        {actions}
        <Btn kind="ghost" label="Log out" onPress={() => signOut()} />
      </View>
    </View>
  );
}

// Login/register frame: the game table with the dealt cards, then the form panel.
const CARDS = ['pizza', 'pizza', 'pizza', 'pasta', 'pizza'];
export function AuthFrame({ title, children }: { title: string; children: ReactNode }) {
  const { colors, mode, toggleMode } = useApp();
  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <Wordmark size={20} />
        <Btn kind="ghost" label={mode === 'dark' ? '☀' : '☾'}
          accessibilityLabel={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`} onPress={toggleMode} />
      </View>
      <T size={17} color={colors.onStageSoft} style={{ marginBottom: 18, maxWidth: 300 }}>
        Everyone gets the same word except one player. Talk it out and find them.
      </T>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 26 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {CARDS.map((w, i) => {
          const odd = w !== 'pizza';
          return (
            <Lifted key={i} radius={10} bg={odd ? colors.odd : colors.paper}
              style={{ transform: [{ rotate: odd ? '-8deg' : i % 2 ? '2deg' : '-2deg' }, { translateY: odd ? -8 : 0 }] }}
              innerStyle={{ width: 56, height: 74, alignItems: 'center', justifyContent: 'center' }}>
              <T weight="bold" size={12} color={odd ? colors.oddInk : colors.ink}>{w}</T>
            </Lifted>
          );
        })}
      </View>
      <View style={{ backgroundColor: colors.paper, borderRadius: 20, padding: 22 }}>
        <T weight="heavy" size={30} accessibilityRole="header" style={{ marginBottom: 14, lineHeight: 34 }}>{title}</T>
        {children}
      </View>
    </>
  );
}

export function PasswordChecklist({ password }: { password: string }) {
  const { colors } = useApp();
  return (
    <View style={{ marginTop: -6, marginBottom: 16, gap: 4 }} accessibilityLabel="Password requirements">
      {PASSWORD_RULES.map((r) => {
        const met = r.test(password);
        return (
          <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            accessible accessibilityLabel={`${r.label}, ${met ? 'done' : 'not yet'}`}>
            <View style={{
              width: 18, height: 18, borderRadius: 5, borderWidth: 2, borderColor: colors.line,
              backgroundColor: met ? colors.okBg : colors.haze, alignItems: 'center', justifyContent: 'center',
            }}>
              {met && <T weight="heavy" size={11} color={colors.okText} style={{ lineHeight: 13 }}>✓</T>}
            </View>
            <T size={14} color={met ? colors.ink : colors.muted}>{r.label}</T>
          </View>
        );
      })}
    </View>
  );
}

export function ThemePicker({ themes, value, onChange, disabled = false }: {
  themes: Theme[]; value: string; onChange: (id: string) => void; disabled?: boolean;
}) {
  const { colors } = useApp();
  const general = themes.filter((t) => t.kind !== 'holiday');
  const holidays = themes.filter((t) => t.kind === 'holiday').sort((a, b) => Number(b.inSeason) - Number(a.inSeason));

  const option = (t: Theme) => {
    const on = value === t.id;
    return (
      <Pressable key={t.id} onPress={() => onChange(t.id)} disabled={disabled}
        accessibilityRole="radio" accessibilityState={{ checked: on, disabled }}
        accessibilityLabel={`${t.name}${t.inSeason ? ', in season' : ''}`}
        style={{ width: '48%', opacity: disabled ? 0.75 : 1 }}>
        <Lifted radius={10} lift={on ? 4 : 0} bg={on ? colors.paper : colors.haze}
          style={on ? { transform: [{ translateY: -2 }] } : undefined}
          innerStyle={{ paddingHorizontal: 10, paddingVertical: 8, minHeight: 64 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <T size={20}>{t.emoji}</T>
            {on && (
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
                <T weight="heavy" size={11} color={colors.paper} style={{ lineHeight: 14 }}>✓</T>
              </View>
            )}
          </View>
          <T weight="bold" size={15}>{t.name}</T>
          {t.inSeason && (
            <View style={{ alignSelf: 'flex-start', backgroundColor: colors.okBg, borderRadius: 4, paddingHorizontal: 5, marginTop: 2 }}>
              <T weight="heavy" size={10} color={colors.okText} style={{ letterSpacing: 0.5 }}>IN SEASON</T>
            </View>
          )}
        </Lifted>
      </Pressable>
    );
  };

  return (
    <View style={{ marginBottom: 16 }} accessibilityRole="radiogroup" accessibilityLabel="Word theme">
      <T weight="bold" size={15} style={{ marginBottom: 8 }}>Word theme</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' }}>{general.map(option)}</View>
      {holidays.length > 0 && (
        <>
          <T weight="bold" size={14} style={{ marginTop: 14, marginBottom: 8 }}>
            Holidays <T size={14} color={colors.muted}>(the whole game dresses up)</T>
          </T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' }}>{holidays.map(option)}</View>
        </>
      )}
    </View>
  );
}

export { Panel };
