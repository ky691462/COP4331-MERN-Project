import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextInputProps, type TextProps, type TextStyle, type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/lib/app-context';
import { fonts, HOLIDAYS } from '@/lib/colors';

// ---------- Text ----------
type Weight = keyof typeof fonts;
export function T({ weight = 'regular', size = 16, color, style, ...rest }:
  TextProps & { weight?: Weight; size?: number; color?: string }) {
  const { colors } = useApp();
  return (
    <Text {...rest}
      style={[{ fontFamily: fonts[weight], fontSize: size, lineHeight: Math.round(size * 1.4), color: color ?? colors.ink }, style]} />
  );
}

export function H1({ children, onStage = false }: { children: ReactNode; onStage?: boolean }) {
  const { colors } = useApp();
  return (
    <T weight="heavy" size={32} accessibilityRole="header"
      color={onStage ? colors.onStage : colors.ink}
      style={{ lineHeight: 36, letterSpacing: -0.6, marginBottom: 10 }}>{children}</T>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return <T weight="heavy" size={22} accessibilityRole="header" style={{ lineHeight: 26, marginBottom: 10 }}>{children}</T>;
}

// ---------- A "game piece": outline + solid shadow underneath ----------
export function Lifted({ children, radius = 10, lift = 4, style, innerStyle, pressed = false, bg }: {
  children: ReactNode; radius?: number; lift?: number; pressed?: boolean; bg?: string;
  style?: StyleProp<ViewStyle>; innerStyle?: StyleProp<ViewStyle>;
}) {
  const { colors } = useApp();
  return (
    <View style={[{ borderRadius: radius, backgroundColor: colors.line, paddingBottom: pressed ? 0 : lift, marginTop: pressed ? lift : 0 }, style]}>
      <View style={[{ borderRadius: radius, borderWidth: 2, borderColor: colors.line, backgroundColor: bg ?? colors.paper }, innerStyle]}>
        {children}
      </View>
    </View>
  );
}

// ---------- Logo and room code tiles ----------
const LETTERS = ['I', 'M', 'P', 'O', 'S', 'T', 'O', 'R'];
export function Wordmark({ size = 18 }: { size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: size * 0.28 }} accessible accessibilityRole="image" accessibilityLabel="Impostor">
      {LETTERS.map((ch, i) => <Tile key={i} ch={ch} size={size} odd={i === 3} />)}
    </View>
  );
}

export function Tile({ ch, size, odd = false }: { ch: string; size: number; odd?: boolean }) {
  const { colors } = useApp();
  return (
    <Lifted radius={Math.max(6, size * 0.3)} lift={Math.max(3, size * 0.16)}
      bg={odd ? colors.odd : colors.paper}
      style={odd ? { transform: [{ rotate: '-9deg' }, { translateY: -3 }] } : undefined}
      innerStyle={{ width: size * 1.45, height: size * 1.55, alignItems: 'center', justifyContent: 'center' }}>
      <T weight="heavy" size={size} color={odd ? colors.oddInk : colors.ink} style={{ lineHeight: size * 1.15 }}>{ch}</T>
    </Lifted>
  );
}

export function CodeTiles({ code }: { code: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }} accessible accessibilityLabel={`Room code ${code.split('').join(' ')}`}>
      {code.split('').map((ch, i) => <Tile key={i} ch={ch} size={24} />)}
    </View>
  );
}

// ---------- Buttons ----------
export function Btn({ label, onPress, kind = 'primary', disabled = false, busy = false, style, accessibilityLabel }: {
  label: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean; busy?: boolean; style?: StyleProp<ViewStyle>; accessibilityLabel?: string;
}) {
  const { colors } = useApp();
  const off = disabled || busy;

  if (kind === 'ghost') {
    return (
      <Pressable onPress={onPress} disabled={off} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label}
        style={({ pressed }) => [styles.ghost, { borderColor: colors.onStage, opacity: pressed || off ? 0.7 : 1 }, style]}>
        <T weight="heavy" size={14} color={colors.onStage}>{label}</T>
      </Pressable>
    );
  }

  const bg = kind === 'primary' ? colors.ink : colors.paper;
  const fg = kind === 'primary' ? colors.paper : colors.ink;
  return (
    <Pressable onPress={onPress} disabled={off} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: off, busy }} style={style}>
      {({ pressed }) => (
        <Lifted pressed={pressed && !off} bg={bg} innerStyle={[styles.btn, off && { opacity: 0.7 }]}>
          {busy ? <ActivityIndicator color={fg} /> : <T weight="heavy" size={17} color={fg}>{label}</T>}
        </Lifted>
      )}
    </Pressable>
  );
}

// ---------- Form field with a real label ----------
export function Field({ label, style, ...input }: TextInputProps & { label: string; style?: StyleProp<TextStyle> }) {
  const { colors } = useApp();
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ marginBottom: 16 }}>
      <T weight="bold" size={15} style={{ marginBottom: 6 }}>{label}</T>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        {...input}
        style={[styles.input, {
          borderColor: focus ? colors.odd : colors.line,
          backgroundColor: focus ? colors.paper : colors.haze,
          color: colors.ink,
        }, style]}
      />
    </View>
  );
}

// ---------- Alerts ----------
export function Alert({ kind, children }: { kind: 'error' | 'success' | 'info'; children: ReactNode }) {
  const { colors } = useApp();
  const [bg, fg] = kind === 'error' ? [colors.errorBg, colors.errorText]
    : kind === 'success' ? [colors.okBg, colors.okText] : [colors.infoBg, colors.infoText];
  return (
    <View accessibilityRole={kind === 'error' ? 'alert' : 'text'} accessibilityLiveRegion="polite"
      style={[styles.alert, { backgroundColor: bg, borderColor: fg }]}>
      {typeof children === 'string' ? <T weight="semibold" size={15} color={fg}>{children}</T> : children}
    </View>
  );
}

// ---------- Panels ----------
export function Panel({ children, piece = false, style }: { children: ReactNode; piece?: boolean; style?: StyleProp<ViewStyle> }) {
  const { colors } = useApp();
  if (piece) {
    return <Lifted radius={20} lift={8} style={[{ marginBottom: 20 }, style]} innerStyle={{ padding: 22 }}>{children}</Lifted>;
  }
  return <View style={[{ backgroundColor: colors.paper, borderRadius: 6, padding: 22, marginBottom: 20 }, style]}>{children}</View>;
}

export function Chip({ children, solid = false }: { children: ReactNode; solid?: boolean }) {
  const { colors } = useApp();
  if (solid) {
    return <Lifted radius={999} lift={3} innerStyle={styles.chip}>{children}</Lifted>;
  }
  return <View style={[styles.chip, { borderWidth: 2, borderColor: colors.onStage, borderRadius: 999 }]}>{children}</View>;
}

export function Tag({ label, odd = false }: { label: string; odd?: boolean }) {
  const { colors } = useApp();
  return (
    <View style={{ backgroundColor: odd ? colors.odd : colors.ink, borderRadius: 4, paddingHorizontal: 5, marginLeft: 6 }}>
      <T weight="heavy" size={10} color={odd ? colors.oddInk : colors.paper} style={{ letterSpacing: 0.6, lineHeight: 16 }}>
        {label.toUpperCase()}
      </T>
    </View>
  );
}

// ---------- Screen frame: game table background, safe areas, scrolling ----------
export function Screen({ children, top }: { children: ReactNode; top?: ReactNode }) {
  const { colors, holiday } = useApp();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.stage }} edges={['top', 'left', 'right']}>
      <HolidayDecor themeId={holiday} />
      <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
        {top}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const SPOTS: [number, number, number][] = [
  [4, 10, -12], [84, 6, 10], [10, 44, 8], [80, 36, -8], [6, 80, 14], [86, 72, -14], [44, 92, 6], [60, 20, -6],
];
function HolidayDecor({ themeId }: { themeId: string | null }) {
  const h = themeId ? HOLIDAYS[themeId] : undefined;
  const { mode } = useApp();
  if (!h) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {SPOTS.map(([x, y, r], i) => (
        <Text key={i} style={{
          position: 'absolute', left: `${x}%`, top: `${y}%`, fontSize: 40,
          opacity: mode === 'dark' ? 0.16 : 0.22, transform: [{ rotate: `${r}deg` }],
        }}>{h.icons[i % h.icons.length]}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, paddingBottom: 48, maxWidth: 640, width: '100%', alignSelf: 'center' },
  btn: { minHeight: 52, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  ghost: { borderWidth: 2, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  input: { fontFamily: fonts.regular, fontSize: 16, borderWidth: 2, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
  alert: { borderWidth: 2, borderRadius: 10, padding: 14, marginBottom: 16, gap: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5 },
});
