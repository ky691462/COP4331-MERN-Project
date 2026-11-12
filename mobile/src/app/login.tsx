import { useState } from 'react';
import { View } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Alert, Btn, Field, Screen, T } from '@/components/ui';
import { AuthFrame } from '@/components/parts';
import { ApiError, login, resendVerification } from '@/lib/api';
import { useApp } from '@/lib/app-context';

export default function LoginScreen() {
  const { signIn, colors } = useApp();
  const params = useLocalSearchParams<{ expired?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [unverified, setUnverified] = useState(false);
  const [resent, setResent] = useState('');
  const [busy, setBusy] = useState(false);

  async function doLogin() {
    setBusy(true);
    setError('');
    setUnverified(false);
    setResent('');
    try {
      const res = await login(email.trim(), password);
      await signIn({ ...res.user, token: res.token });
      router.replace('/home');
    } catch (err) {
      if (err instanceof ApiError && err.status === 403 && err.data.needsVerification) setUnverified(true);
      else if (err instanceof ApiError && err.status === 401) setError("That email and password don't match an account. Check them and try again.");
      else setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function doResend() {
    try { setResent((await resendVerification(email.trim())).message); }
    catch (err) { setResent(err instanceof Error ? err.message : 'Could not send the email.'); }
  }

  return (
    <Screen>
      <AuthFrame title="Log in">
        {params.expired && !error && !unverified && <Alert kind="info">Your session expired. Log in again to keep playing.</Alert>}
        {unverified && (
          <Alert kind="info">
            <T weight="semibold" size={15} color={colors.infoText}>
              Please verify your email first. We sent a link to {email.trim()}.
            </T>
            <Btn kind="secondary" label="Send the link again" onPress={doResend} />
            {!!resent && <T size={14} color={colors.infoText}>{resent}</T>}
          </Alert>
        )}
        {!!error && <Alert kind="error">{error}</Alert>}
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address"
          autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry
          autoComplete="current-password" textContentType="password" onSubmitEditing={doLogin} />
        <Link href="/forgot-password" style={{ marginTop: -4, marginBottom: 16 }}>
          <T weight="bold" size={15} color={colors.link}>Forgot your password?</T>
        </Link>
        <Btn label={busy ? 'Logging in…' : 'Log in'} busy={busy} onPress={doLogin}
          disabled={!email.trim() || !password} />
        <View style={{ flexDirection: 'row', marginTop: 20, flexWrap: 'wrap' }}>
          <T color={colors.muted}>New here? </T>
          <Link href="/register"><T weight="bold" color={colors.link}>Create an account</T></Link>
        </View>
      </AuthFrame>
    </Screen>
  );
}
