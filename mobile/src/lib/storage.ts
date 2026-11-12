import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Phones keep the login token in the encrypted keychain/keystore (SecureStore).
// SecureStore doesn't exist on web, so the web preview uses localStorage.
const web = Platform.OS === 'web';

export async function getItem(key: string): Promise<string | null> {
  try {
    return web ? globalThis.localStorage?.getItem(key) ?? null : await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  try {
    if (web) globalThis.localStorage?.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  } catch { /* not critical */ }
}

export async function removeItem(key: string): Promise<void> {
  try {
    if (web) globalThis.localStorage?.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  } catch { /* not critical */ }
}
