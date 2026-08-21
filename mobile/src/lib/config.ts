import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string; socketUrl?: string };

export const API_URL = extra.apiUrl ?? 'http://10.0.2.2:4000/api/v1';
export const SOCKET_URL = extra.socketUrl ?? 'http://10.0.2.2:4000';
