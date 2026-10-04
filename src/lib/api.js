const configuredUrl = import.meta.env.VITE_API_URL || 'http://10.32.37.200:3000';

export const API_BASE_URL = configuredUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
export const API_URL = `${API_BASE_URL}/api`;
export const SOCKET_URL = API_BASE_URL;