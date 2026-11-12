import { useState } from 'react';
import { View } from 'react-native';
import { Link } from 'expo-router';
import { Alert, Btn, Field, Screen, T } from '@/components/ui';
import { AuthFrame } from '@/components/parts';
import { forgotPassword } from '@/lib/api';
import { useApp } from '@/lib/app-context';

// The reset link in the email opens the website, where the new password is chosen.
export default function ForgotPasswordScreen() {
  const { colors } = useApp();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function doSend() {
    setBusy(true);
    setError('');
    try { setSent((await forgotPassword(email.trim())).message); }
    catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.'); }
    finally { setBusy(false); }
  }

  return (
    <Screen>
      <AuthFrame title="Reset your password">
        {sent ? <Alert kind="success">{sent}</Alert> : (
          <>
            <T color={colors.muted} style={{ marginBottom: 14 }}>
              Enter your account’s email and we’ll send you a link to choose a new password.
            </T>
            <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address"
              autoCapitalize="none" autoComplete="email" />
            {!!error && <Alert kind="error">{error}</Alert>}
            <Btn label={busy ? 'Sending…' : 'Send reset link'} busy={busy} onPress={doSend} disabled={!email.trim()} />
          </>
        )}
        <View style={{ flexDirection: 'row', marginTop: 20 }}>
          <T color={colors.muted}>Remembered it? </T>
          <Link href="/login"><T weight="bold" color={colors.link}>Log in</T></Link>
        </View>
      </AuthFrame>
    </Screen>
  );
}
