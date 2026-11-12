import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Alert, Btn, Field, H1, H2, Panel, Screen, T } from '@/components/ui';
import { ThemePicker, TopBar } from '@/components/parts';
import { createGame, getThemes, joinGame, type Theme } from '@/lib/api';
import { useApp, useHolidaySkin } from '@/lib/app-context';

export default function HomeScreen() {
  const { user, colors } = useApp();
  const params = useLocalSearchParams<{ join?: string; ended?: string }>();

  const [themes, setThemes] = useState<Theme[]>([]);
  const [theme, setTheme] = useState('classic');
  const [hostNick, setHostNick] = useState(user?.firstName ?? '');
  const [hostMsg, setHostMsg] = useState('');
  const [hosting, setHosting] = useState(false);

  const [joinCode, setJoinCode] = useState(params.join ? String(params.join).toUpperCase().slice(0, 8) : '');
  const [nickname, setNickname] = useState(user?.firstName ?? '');
  const [joinMsg, setJoinMsg] = useState(params.ended ? 'That game has ended.' : '');

  // A newly scanned code (from the scan screen) replaces what's typed.
  const [seenJoin, setSeenJoin] = useState(params.join);
  if (params.join !== seenJoin) {
    setSeenJoin(params.join);
    if (params.join) setJoinCode(String(params.join).toUpperCase().slice(0, 8));
  }
  const [joining, setJoining] = useState(false);

  // Picking a holiday theme previews its look right away.
  useHolidaySkin(theme);

  useEffect(() => {
    getThemes()
      .then((res) => { setThemes(res.themes); if (res.featured[0]) setTheme(res.featured[0]); })
      .catch(() => setHostMsg('Could not load the word themes. Pull down or reopen to try again.'));
  }, []);

  if (!user) return <Redirect href="/login" />;

  async function doHost() {
    setHosting(true);
    setHostMsg('');
    try {
      const game = await createGame(theme, hostNick.trim());
      router.push({ pathname: '/game/[code]', params: { code: game.code } });
    } catch (err) {
      setHostMsg(err instanceof Error ? err.message : 'Could not create a room.');
    } finally {
      setHosting(false);
    }
  }

  async function doJoin() {
    setJoinMsg('');
    const code = joinCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,8}$/.test(code)) return setJoinMsg('Room codes are 4–8 letters or numbers.');
    setJoining(true);
    try {
      const game = await joinGame(code, nickname.trim());
      router.push({ pathname: '/game/[code]', params: { code: game.code } });
    } catch (err) {
      setJoinMsg(err instanceof Error ? err.message : 'Could not join that room.');
    } finally {
      setJoining(false);
    }
  }

  return (
    <Screen top={<TopBar />}>
      <H1 onStage>Ready to play, {user.firstName}?</H1>
      <T size={18} color={colors.onStageSoft} style={{ marginBottom: 22 }}>
        Host a room and share the code, or join a friend’s game.
      </T>

      <Panel piece>
        <H2>Host a game</H2>
        <T color={colors.muted} style={{ marginBottom: 14 }}>Pick a theme for the secret words, then share your room code.</T>
        {themes.length > 0 && <ThemePicker themes={themes} value={theme} onChange={setTheme} />}
        <Field label="Your nickname" value={hostNick} onChangeText={setHostNick} maxLength={20} />
        <Btn label={hosting ? 'Creating room…' : 'Create room'} busy={hosting} onPress={doHost}
          disabled={themes.length === 0 || !hostNick.trim()} />
        {!!hostMsg && <View style={{ marginTop: 16 }}><Alert kind="error">{hostMsg}</Alert></View>}
      </Panel>

      <Panel>
        <H2>Join a game</H2>
        <Btn kind="secondary" label="Scan a room QR code" onPress={() => router.push('/scan')} style={{ marginBottom: 18 }} />
        <Field label="Room code" value={joinCode} maxLength={8} autoCapitalize="characters" autoCorrect={false}
          onChangeText={(v) => setJoinCode(v.toUpperCase())}
          style={{ letterSpacing: 4, fontFamily: 'BricolageGrotesque_800ExtraBold' }} />
        <Field label="Nickname" value={nickname} onChangeText={setNickname} maxLength={20} onSubmitEditing={doJoin} />
        <Btn label={joining ? 'Joining…' : 'Join room'} busy={joining} onPress={doJoin}
          disabled={!joinCode.trim() || !nickname.trim()} />
        {!!joinMsg && <View style={{ marginTop: 16 }}><Alert kind="error">{joinMsg}</Alert></View>}
      </Panel>

      <H2Stage>How to play</H2Stage>
      {['Everyone gets the same secret word, except the impostor, who only knows the theme.',
        'Take turns giving a one-word clue out loud.',
        'Vote on who you think the impostor is.'].map((line, i) => (
        <T key={i} size={17} color={colors.onStageSoft} style={{ marginBottom: 8 }}>
          <T weight="heavy" size={17} color={colors.onStage}>{i + 1}. </T>{line}
        </T>
      ))}
    </Screen>
  );
}

function H2Stage({ children }: { children: string }) {
  const { colors } = useApp();
  return <T weight="heavy" size={22} color={colors.onStage} accessibilityRole="header" style={{ marginTop: 10, marginBottom: 10 }}>{children}</T>;
}
