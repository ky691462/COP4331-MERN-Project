import { useState } from 'react';
import { View } from 'react-native';
import { Link } from 'expo-router';
import { Alert, Btn, Field, Screen, T } from '@/components/ui';
import { AuthFrame, PasswordChecklist } from '@/components/parts';
import { register, resendVerification } from '@/lib/api';
import { passwordOk } from '@/lib/password';
import { useApp } from '@/lib/app-context';

export default function RegisterScreen() {
  const { colors } = useApp();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState<null | { emailSent: boolean; message: string }>(null);
  const [resent, setResent] = useState('');
  const [busy, setBusy] = useState(false);

  async function doRegister() {
    setError('');
    if (!firstName.trim() || !lastName.trim() || !email.trim()) return setError('Please fill in every field.');
    if (!passwordOk(password)) return setError('Your password needs everything on the checklist.');
    if (password !== confirm) return setError('Passwords do not match.');
    setBusy(true);
    try {
      const res = await register({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), password });
      setDone({ emailSent: res.emailSent, message: res.message });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function doResend() {
    try { setResent((await resendVerification(email.trim())).message); }
    catch (err) { setResent(err instanceof Error ? err.message : 'Could not send the email.'); }
  }

  if (done) {
    return (
      <Screen>
        <AuthFrame title="Check your email">
          <Alert kind={done.emailSent ? 'success' : 'error'}>
            {done.emailSent
              ? `Welcome, ${firstName.trim()}! We sent a link to ${email.trim()}. Open it on any device to verify your account, then log in.`
              : done.message}
          </Alert>
          <Btn kind="secondary" label="Send the link again" onPress={doResend} />
          {!!resent && <T size={14} color={colors.muted} style={{ marginTop: 12 }}>{resent}</T>}
          <View style={{ flexDirection: 'row', marginTop: 20 }}>
            <T color={colors.muted}>Verified already? </T>
            <Link href="/login"><T weight="bold" color={colors.link}>Log in</T></Link>
          </View>
        </AuthFrame>
      </Screen>
    );
  }

  return (
    <Screen>
      <AuthFrame title="Create an account">
        <Field label="First name" value={firstName} onChangeText={setFirstName} autoComplete="given-name" textContentType="givenName" />
        <Field label="Last name" value={lastName} onChangeText={setLastName} autoComplete="family-name" textContentType="familyName" />
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address"
          autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry
          autoComplete="new-password" textContentType="newPassword" />
        <PasswordChecklist password={password} />
        <Field label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry
          autoComplete="new-password" textContentType="newPassword" />
        {!!error && <Alert kind="error">{error}</Alert>}
        <Btn label={busy ? 'Creating account…' : 'Create account'} busy={busy} onPress={doRegister} />
        <View style={{ flexDirection: 'row', marginTop: 20 }}>
          <T color={colors.muted}>Already have an account? </T>
          <Link href="/login"><T weight="bold" color={colors.link}>Log in</T></Link>
        </View>
      </AuthFrame>
    </Screen>
  );
}
