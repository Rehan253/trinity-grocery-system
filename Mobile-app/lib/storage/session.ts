import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "@trinity/auth_token";
const REFRESH_TOKEN_KEY = "@trinity/refresh_token";
const USER_KEY = "@trinity/auth_user";

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getStoredRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function getStoredUserJson(): Promise<string | null> {
  return AsyncStorage.getItem(USER_KEY);
}

export async function saveSession(
  token: string,
  userJson: string,
  refreshToken?: string,
): Promise<void> {
  const pairs: [string, string][] = [
    [TOKEN_KEY, token],
    [USER_KEY, userJson],
  ];
  if (refreshToken) {
    pairs.push([REFRESH_TOKEN_KEY, refreshToken]);
  }
  await AsyncStorage.multiSet(pairs);
}

export async function saveAccessToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
}
