import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import aesjs from 'aes-js';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY?.trim();
export const supabaseConfig = {
  hasUrl: !!url,
  hasKey: !!key,
  urlLooksValid:
    !!url && /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url),
};

if (__DEV__) {
  console.log('[focusly-auth][dev] supabase config', {
    hasUrl: supabaseConfig.hasUrl,
    hasKey: supabaseConfig.hasKey,
    urlLooksValid: supabaseConfig.urlLooksValid,
  });
}

function configError(): Error {
  if (__DEV__) {
    return new Error(
      'Supabase configuration is missing or invalid. Check EXPO_PUBLIC_SUPABASE_URL (https://<project-ref>.supabase.co) and EXPO_PUBLIC_SUPABASE_KEY in .env, then restart with --clear.'
    );
  }
  return new Error('Supabase configuration error.');
}

if (!url || !key) {
  throw configError();
}

const normalizedUrl = url.replace(/\/+$/, '');
const isWeb = Platform.OS === 'web';
const hasWindow = typeof window !== 'undefined';

class LargeSecureStore {
  private async _encrypt(storeKey: string, value: string): Promise<string> {
    const encryptionKey = crypto.getRandomValues(new Uint8Array(256 / 8));
    const cipher = new aesjs.ModeOfOperation.ctr(
      encryptionKey,
      new aesjs.Counter(1)
    );
    const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
    await SecureStore.setItemAsync(storeKey, aesjs.utils.hex.fromBytes(encryptionKey));
    return aesjs.utils.hex.fromBytes(encryptedBytes);
  }

  private async _decrypt(storeKey: string, value: string): Promise<string | null> {
    const encryptionKeyHex = await SecureStore.getItemAsync(storeKey);
    if (!encryptionKeyHex) return null;
    const cipher = new aesjs.ModeOfOperation.ctr(
      aesjs.utils.hex.toBytes(encryptionKeyHex),
      new aesjs.Counter(1)
    );
    const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(value));
    return aesjs.utils.utf8.fromBytes(decryptedBytes);
  }

  async getItem(storeKey: string): Promise<string | null> {
    if (isWeb) {
      if (!hasWindow) return null;
      return window.localStorage.getItem(storeKey);
    }
    const encrypted = await AsyncStorage.getItem(storeKey);
    if (!encrypted) return null;
    return await this._decrypt(storeKey, encrypted);
  }

  async removeItem(storeKey: string): Promise<void> {
    if (isWeb) {
      if (hasWindow) window.localStorage.removeItem(storeKey);
      return;
    }
    await AsyncStorage.removeItem(storeKey);
    await SecureStore.deleteItemAsync(storeKey);
  }

  async setItem(storeKey: string, value: string): Promise<void> {
    if (isWeb) {
      if (hasWindow) window.localStorage.setItem(storeKey, value);
      return;
    }
    const encrypted = await this._encrypt(storeKey, value);
    await AsyncStorage.setItem(storeKey, encrypted);
  }
}

const storage = new LargeSecureStore();

export const supabase: SupabaseClient = createClient(normalizedUrl, key, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: isWeb && hasWindow,
  },
});

if (!isWeb) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
