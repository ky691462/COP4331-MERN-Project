// The website's brand colors (frontend/src/index.css), as JS for React Native.
export interface Palette {
  stage: string; ink: string; line: string; paper: string; haze: string;
  odd: string; oddInk: string; muted: string; link: string;
  onStage: string; onStageSoft: string;
  errorBg: string; errorText: string; okBg: string; okText: string; infoBg: string; infoText: string;
}

export const light: Palette = {
  stage: '#2b44d6', ink: '#15133b', line: '#15133b', paper: '#ffffff', haze: '#eef0ff',
  odd: '#ff4f86', oddInk: '#15133b', muted: '#4a4f73', link: '#2237b8',
  onStage: '#ffffff', onStageSoft: '#dfe4ff',
  errorBg: '#fff0f3', errorText: '#9b1037', okBg: '#e9f8f0', okText: '#0c5b39', infoBg: '#eef0ff', infoText: '#2237b8',
};

export const dark: Palette = {
  ...light,
  stage: '#0f0e2e', ink: '#f2f3ff', line: '#04031a', paper: '#1d1b4d', haze: '#2a2866',
  muted: '#bcc0e6', link: '#aebaff', onStage: '#f2f3ff', onStageSoft: '#c4c9ef',
  errorBg: '#3a1026', errorText: '#ffb8cc', okBg: '#0e3324', okText: '#a6f0cb', infoBg: '#23266b', infoText: '#d3d9ff',
};

// Holiday themes recolor only the game table (same values as the website).
export const HOLIDAYS: Record<string, { light: string; dark: string; icons: string[] }> = {
  halloween: { light: '#b9400c', dark: '#1c0f26', icons: ['🎃', '🦇', '👻', '🕸️'] },
  thanksgiving: { light: '#8f3412', dark: '#24140b', icons: ['🍂', '🦃', '🥧', '🌽'] },
  'winter-holidays': { light: '#17643a', dark: '#0b1f2a', icons: ['❄️', '🎄', '🎁', '⛄'] },
  valentines: { light: '#b0103a', dark: '#2a0a17', icons: ['💘', '🌹', '💌', '🍫'] },
  'fourth-of-july': { light: '#1e3a8a', dark: '#0a1230', icons: ['🎆', '⭐', '🎇', '🇺🇸'] },
};

export function paletteFor(mode: 'light' | 'dark', holiday: string | null): Palette {
  const base = mode === 'dark' ? dark : light;
  const h = holiday ? HOLIDAYS[holiday] : undefined;
  if (!h) return base;
  return {
    ...base,
    stage: h[mode],
    onStage: mode === 'dark' ? '#f2f3ff' : '#ffffff',
    onStageSoft: mode === 'dark' ? '#d9dcf3' : '#fff4ea',
  };
}

export const fonts = {
  regular: 'BricolageGrotesque_400Regular',
  medium: 'BricolageGrotesque_500Medium',
  semibold: 'BricolageGrotesque_600SemiBold',
  bold: 'BricolageGrotesque_700Bold',
  heavy: 'BricolageGrotesque_800ExtraBold',
};
