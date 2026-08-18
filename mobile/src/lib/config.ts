import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string; socketUrl?: string };

/**
 * En emulador Android, 10.0.2.2 apunta al equipo anfitrion.
 * Para dispositivos fisicos reemplace por la IP del servidor en app.json.
 */
export const API_URL = extra.apiUrl ?? 'http://10.0.2.2:4000/api/v1';
export const SOCKET_URL = extra.socketUrl ?? 'http://10.0.2.2:4000';
