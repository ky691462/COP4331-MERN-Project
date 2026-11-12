import { useEffect, useState } from 'react';
import { Pressable, Share, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { Alert, Btn, Chip, CodeTiles, H1, H2, Lifted, Panel, Screen, T, Tag } from '@/components/ui';
import { ThemePicker, TopBar } from '@/components/parts';
import {
  castVote, finishVoting, getThemes, leaveGame, openVoting, setGameTheme, startRound, WEB_URL,
  type GameState, type Theme,
} from '@/lib/api';
import { useApp, useHolidaySkin } from '@/lib/app-context';
import { useGame } from '@/lib/useGame';

// One screen for the whole game; what it shows follows game.status:
// lobby -> reveal (see your word, give clues out loud) -> voting -> results -> next round.
export default function GameScreen() {
  const { code = '' } = useLocalSearchParams<{ code: string }>();
  const { user, colors } = useApp();
  const { game, apply, gone, offline } = useGame(String(code).toUpperCase());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [themes, setThemes] = useState<Theme[]>([]);
  useHolidaySkin(game?.theme.id);

  useEffect(() => {
    getThemes().then((res) => setThemes(res.themes)).catch(() => { /* picker just won't show */ });
  }, []);

  if (!user) return <Redirect href="/login" />;

  async function act(action: () => Promise<GameState>) {
    setBusy(true);
    setError('');
    try { apply(await action()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.'); }
    finally { setBusy(false); }
  }

  async function doLeave() {
    try { await leaveGame(String(code)); } catch { /* leaving anyway */ }
    router.replace('/home');
  }

  const top = <TopBar actions={<Btn kind="ghost" label="Leave game" onPress={doLeave} />} />;

  if (gone) {
    return (
      <Screen top={top}>
        <H1 onStage>This game is over</H1>
        <T size={18} color={colors.onStageSoft} style={{ marginBottom: 20 }}>{gone}</T>
        <Btn kind="secondary" label="Back to home" onPress={() => router.replace('/home')} />
      </Screen>
    );
  }

  if (!game) {
    return <Screen top={top}><T size={18} color={colors.onStageSoft}>Loading the game…</T></Screen>;
  }

  const host = game.players.find((p) => p.isHost);
  const hostName = game.you.isHost ? 'you' : host?.nickname ?? 'the host';

  return (
    <Screen top={top}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <Chip solid><T weight="heavy" size={15}>{game.theme.emoji} {game.theme.name}</T></Chip>
        <Chip><T weight="semibold" size={15} color={colors.onStage}>Room <T weight="heavy" size={15} color={colors.onStage}>{game.code}</T></T></Chip>
        {game.round > 0 && <Chip><T weight="semibold" size={15} color={colors.onStage}>Round {game.round}</T></Chip>}
      </View>

      {offline && <Alert kind="info">Reconnecting to the server…</Alert>}
      {!!error && <Alert kind="error">{error}</Alert>}

      {game.status === 'lobby' && (
        <Lobby game={game} themes={themes} busy={busy} hostName={hostName}
          onTheme={(t) => act(() => setGameTheme(game.code, t))}
          onStart={() => act(() => startRound(game.code))} />
      )}
      {game.status === 'reveal' && (
        <Reveal game={game} busy={busy} hostName={hostName} onVote={() => act(() => openVoting(game.code))} />
      )}
      {game.status === 'voting' && (
        <Voting game={game} busy={busy}
          onVote={(id) => act(() => castVote(game.code, id))}
          onFinish={() => act(() => finishVoting(game.code))} />
      )}
      {game.status === 'results' && (
        <Results game={game} themes={themes} busy={busy} hostName={hostName}
          onTheme={(t) => act(() => setGameTheme(game.code, t))}
          onNext={() => act(() => startRound(game.code))} />
      )}
    </Screen>
  );
}

// ---------- Lobby ----------
function Lobby({ game, themes, busy, hostName, onTheme, onStart }: {
  game: GameState; themes: Theme[]; busy: boolean; hostName: string;
  onTheme: (id: string) => void; onStart: () => void;
}) {
  const { colors } = useApp();
  const missing = Math.max(0, game.minPlayers - game.players.length);
  // Same link as the website's QR: opens the site with the code filled in,
  // and the app's scanner understands it too.
  const joinUrl = `${WEB_URL}/home?join=${game.code}`;

  return (
    <>
      <H1 onStage>{game.you.isHost ? 'Your room is open' : 'You’re in!'}</H1>
      <T size={18} color={colors.onStageSoft} style={{ marginBottom: 20 }}>
        {game.you.isHost ? 'Share the code. Start when everyone’s here.' : `Waiting for ${hostName} to start the game.`}
      </T>

      <Panel piece>
        <H2>Room code</H2>
        <View style={{ gap: 16, alignItems: 'flex-start' }}>
          <CodeTiles code={game.code} />
          <Btn kind="secondary" label="Share code" onPress={() => Share.share({ message: `Join my Impostor game! Room code ${game.code}: ${joinUrl}` })} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Lifted radius={10} bg="#ffffff" innerStyle={{ padding: 6 }}>
              <QRCode value={joinUrl} size={112} color="#15133b" backgroundColor="#ffffff" />
            </Lifted>
            <T size={15} color={colors.muted} style={{ flex: 1 }}>Scan with a phone camera to join</T>
          </View>
        </View>
      </Panel>

      <Panel>
        <H2>Players <T weight="bold" size={16} color={colors.muted}>{game.players.length}/{game.maxPlayers}</T></H2>
        <PlayerList game={game} />
        {game.you.isHost ? (
          <>
            {themes.length > 0 && (
              <View style={{ marginTop: 18 }}>
                <ThemePicker themes={themes} value={game.theme.id} onChange={onTheme} disabled={busy} />
              </View>
            )}
            <Btn label={busy ? 'Dealing…' : 'Start game'} busy={busy} onPress={onStart} disabled={!game.canStart} />
            {missing > 0 && (
              <T size={15} color={colors.muted} style={{ marginTop: 12 }}>
                Need {missing} more {missing === 1 ? 'player' : 'players'} to start (minimum {game.minPlayers}).
              </T>
            )}
          </>
        ) : (
          <T size={15} color={colors.muted} style={{ marginTop: 12 }}>The host picks the theme and starts the round.</T>
        )}
      </Panel>
    </>
  );
}

// ---------- Reveal ----------
function Reveal({ game, busy, hostName, onVote }: {
  game: GameState; busy: boolean; hostName: string; onVote: () => void;
}) {
  const { colors } = useApp();
  const [shown, setShown] = useState(false); // hidden so neighbors can't peek
  const { isImpostor, word } = game.you;
  const impostorCard = shown && isImpostor;

  return (
    <>
      <H1 onStage>Your secret</H1>
      <T size={18} color={colors.onStageSoft} style={{ marginBottom: 20 }}>
        Tap the card to see it. Then take turns giving a one-word clue out loud.
      </T>

      <Pressable onPress={() => setShown(!shown)} accessibilityRole="button"
        accessibilityLabel={shown ? 'Hide your word' : 'Show your word'} accessibilityState={{ selected: shown }}
        style={{ alignSelf: 'center', width: '82%', maxWidth: 320, marginBottom: 26 }}>
        <Lifted radius={22} lift={8} bg={impostorCard ? colors.odd : colors.paper}
          style={{ transform: [{ rotate: impostorCard ? '-6deg' : '-2deg' }, { translateY: impostorCard ? -6 : 0 }] }}
          innerStyle={{ aspectRatio: 3 / 4, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 10, borderWidth: 3 }}>
          {!shown && (
            <View style={{ width: '100%', borderWidth: 2, borderStyle: 'dashed', borderColor: colors.line, borderRadius: 14, paddingVertical: 40, backgroundColor: colors.haze, alignItems: 'center' }}>
              <T weight="heavy" size={20}>Tap to reveal</T>
            </View>
          )}
          {shown && (
            <>
              <T weight="bold" size={13} color={impostorCard ? colors.oddInk : colors.ink} style={{ letterSpacing: 1.2 }}>
                {isImpostor ? 'YOU ARE' : 'YOUR WORD'}
              </T>
              <T weight="heavy" size={36} color={impostorCard ? colors.oddInk : colors.ink} style={{ textAlign: 'center', lineHeight: 40 }}>
                {isImpostor ? 'the impostor' : word}
              </T>
              <T weight="semibold" size={15} color={impostorCard ? colors.oddInk : colors.ink} style={{ textAlign: 'center' }}>
                {isImpostor ? `Theme: ${game.theme.emoji} ${game.theme.name}. Blend in.` : 'Don’t say it! Hint at it.'}
              </T>
            </>
          )}
        </Lifted>
      </Pressable>

      <Panel>
        <H2>Round {game.round}</H2>
        <PlayerList game={game} />
        {game.you.isHost ? (
          <Btn label="Everyone’s given a clue: vote" busy={busy} onPress={onVote} style={{ marginTop: 16 }} />
        ) : (
          <T size={15} color={colors.muted} style={{ marginTop: 12 }}>When everyone has given a clue, {hostName} opens the vote.</T>
        )}
      </Panel>
    </>
  );
}

// ---------- Voting ----------
function Voting({ game, busy, onVote, onFinish }: {
  game: GameState; busy: boolean; onVote: (id: string) => void; onFinish: () => void;
}) {
  const { colors } = useApp();
  const voted = game.players.filter((p) => p.hasVoted).length;
  const others = game.players.filter((p) => p.userId !== game.you.userId);

  return (
    <>
      <H1 onStage>Who’s the impostor?</H1>
      <T size={18} color={colors.onStageSoft} style={{ marginBottom: 20 }}>
        {game.you.vote ? 'Vote counted. You can change it until everyone has voted.' : 'Pick the player you think didn’t know the word.'}
      </T>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', marginBottom: 20 }}>
        {others.map((p) => {
          const mine = game.you.vote === p.userId;
          return (
            <Pressable key={p.userId} onPress={() => onVote(p.userId)} disabled={busy} style={{ width: '48%' }}
              accessibilityRole="button" accessibilityState={{ selected: mine, disabled: busy }}
              accessibilityLabel={`Vote for ${p.nickname}${mine ? ', your vote' : ''}`}>
              {({ pressed }) => (
                <Lifted radius={14} pressed={pressed} bg={mine ? colors.ink : colors.paper}
                  style={mine ? { transform: [{ rotate: '-2deg' }, { translateY: -3 }] } : undefined}
                  innerStyle={{ minHeight: 96, padding: 14, justifyContent: 'space-between' }}>
                  <T weight="heavy" size={19} color={mine ? colors.paper : colors.ink}>{p.nickname}</T>
                  <T weight="bold" size={13} color={mine ? colors.paper : colors.muted}>{mine ? 'Your vote' : 'Vote'}</T>
                </Lifted>
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}
        accessible accessibilityLabel={`${voted} of ${game.players.length} have voted`}>
        <T size={17} color={colors.onStage}><T weight="heavy" size={17} color={colors.onStage}>{voted} of {game.players.length}</T> have voted</T>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {game.players.map((p) => (
            <View key={p.userId} style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: colors.onStage, backgroundColor: p.hasVoted ? colors.onStage : 'transparent' }} />
          ))}
        </View>
      </View>
      {game.you.isHost && voted < game.players.length && (
        <Btn kind="secondary" label="End the vote now" busy={busy} onPress={onFinish} />
      )}
    </>
  );
}

// ---------- Results ----------
function Results({ game, themes, busy, hostName, onTheme, onNext }: {
  game: GameState; themes: Theme[]; busy: boolean; hostName: string;
  onTheme: (id: string) => void; onNext: () => void;
}) {
  const { colors } = useApp();
  const r = game.result!;
  const youWereIt = r.impostorId === game.you.userId;
  const nameOf = (id: string | null) => game.players.find((p) => p.userId === id)?.nickname ?? '—';
  const most = Math.max(1, ...r.votes.map((v) => v.votes));
  const ranking = [...game.players].sort((a, b) => b.score - a.score);

  return (
    <>
      <H1 onStage>{r.caught ? 'Impostor caught!' : 'The impostor got away!'}</H1>
      <T size={18} color={colors.onStageSoft} style={{ marginBottom: 20 }}>
        {youWereIt ? 'You were' : <T weight="heavy" size={18} color={colors.onStage}>{r.impostorNickname}</T>}
        {youWereIt ? '' : ' was'} the impostor. The word was <T weight="heavy" size={18} color={colors.onStage}>{r.word}</T>.
      </T>

      <Panel piece>
        <H2>Votes</H2>
        <View style={{ gap: 14 }}>
          {r.votes.map((v) => {
            const isImp = v.userId === r.impostorId;
            return (
              <View key={v.userId} accessible accessibilityLabel={`${v.nickname}${isImp ? ', impostor' : ''}: ${v.votes} votes, voted for ${nameOf(v.votedFor)}`}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <T weight="heavy">{v.nickname}</T>{isImp && <Tag label="Impostor" odd />}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ flex: 1, height: 14, borderRadius: 999, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.haze, overflow: 'hidden' }}>
                    <View style={{ width: `${(v.votes / most) * 100}%`, height: '100%', backgroundColor: isImp ? colors.odd : colors.ink }} />
                  </View>
                  <T weight="heavy" style={{ width: 22, textAlign: 'right' }}>{v.votes}</T>
                </View>
                <T size={13} color={colors.muted}>voted for {nameOf(v.votedFor)}</T>
              </View>
            );
          })}
        </View>
      </Panel>

      <Panel>
        <H2>Scores</H2>
        {ranking.map((p, i) => (
          <View key={p.userId} style={{ flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: colors.haze }}>
            <T weight="heavy" color={colors.muted} style={{ width: 26 }}>{i + 1}</T>
            <T weight="semibold" style={{ flex: 1 }}>{p.nickname}{p.userId === game.you.userId ? ' (you)' : ''}</T>
            <T weight="heavy">{p.score}</T>
          </View>
        ))}
        <T size={14} color={colors.muted} style={{ marginTop: 12 }}>
          Catch the impostor: +1 for each correct vote. Impostor escapes: +2.
        </T>
        {game.you.isHost ? (
          <>
            {themes.length > 0 && (
              <View style={{ marginTop: 18 }}>
                <ThemePicker themes={themes} value={game.theme.id} onChange={onTheme} disabled={busy} />
              </View>
            )}
            <Btn label={busy ? 'Dealing…' : 'Play another round'} busy={busy} onPress={onNext} disabled={!game.canStart} />
            {!game.canStart && <T size={14} color={colors.muted} style={{ marginTop: 10 }}>Need at least {game.minPlayers} players for another round.</T>}
          </>
        ) : (
          <T size={15} color={colors.muted} style={{ marginTop: 12 }}>Waiting for {hostName} to start the next round. New players can join now.</T>
        )}
      </Panel>
    </>
  );
}

function PlayerList({ game }: { game: GameState }) {
  const { colors } = useApp();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} accessibilityLabel="Players in room">
      {game.players.map((p) => (
        <View key={p.userId} style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: colors.line, borderRadius: 8, backgroundColor: colors.haze, paddingHorizontal: 10, paddingVertical: 4 }}>
          <T weight="bold">{p.nickname}{p.userId === game.you.userId ? ' (you)' : ''}</T>
          {p.isHost && <Tag label="Host" />}
        </View>
      ))}
    </View>
  );
}
