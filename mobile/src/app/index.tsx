import { Redirect } from 'expo-router';
import { useApp } from '@/lib/app-context';

// First screen: logged in -> home, otherwise -> log in.
export default function Index() {
  const { user } = useApp();
  return <Redirect href={user ? '/home' : '/login'} />;
}
