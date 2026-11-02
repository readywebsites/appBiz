import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

class SafeStorage {
  private memoryFallback: Map<string, string> = new Map();

  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS !== 'web') {
        return await SecureStore.getItemAsync(key);
      }
      return localStorage.getItem(key);
    } catch {
      return this.memoryFallback.get(key) || null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(key, value);
      } else {
        localStorage.setItem(key, value);
      }
    } catch {
      this.memoryFallback.set(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(key);
      } else {
        localStorage.removeItem(key);
      }
    } catch {
      this.memoryFallback.delete(key);
    }
  }
}

export const storage = new SafeStorage();

