import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "@trinity/auth_token";
const USER_KEY = "@trinity/auth_user";

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getStoredUserJson(): Promise<string | null> {
  return AsyncStorage.getItem(USER_KEY);
}

export async function saveSession(token: string, userJson: string): Promise<void> {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, userJson],
  ]);
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}
