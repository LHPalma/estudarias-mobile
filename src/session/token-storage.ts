import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/** Onde o refresh token fica entre uma abertura do app e outra. */
export type TokenStorage = {
  read(): Promise<string | null>;
  write(token: string): Promise<void>;
  clear(): Promise<void>;
};

const KEY = 'estudarias.refreshToken';

/** No celular, o cofre do sistema (Keychain no iOS, Keystore no Android). */
const secureStorage: TokenStorage = {
  read: () => SecureStore.getItemAsync(KEY),
  write: (token) => SecureStore.setItemAsync(KEY, token),
  clear: () => SecureStore.deleteItemAsync(KEY),
};

/**
 * No navegador o expo-secure-store não existe. A web só serve para desenvolver, então o token fica no sessionStorage, que
 * some ao fechar a aba.
 */
const webStorage: TokenStorage = {
  read: async () => globalThis.sessionStorage?.getItem(KEY) ?? null,
  write: async (token) => globalThis.sessionStorage?.setItem(KEY, token),
  clear: async () => globalThis.sessionStorage?.removeItem(KEY),
};

export const deviceTokenStorage: TokenStorage = Platform.OS === 'web' ? webStorage : secureStorage;
