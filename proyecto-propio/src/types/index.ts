// Tipos globales de la aplicación
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export type Theme = 'light' | 'dark';

export interface AppConfig {
  apiUrl: string;
  theme: Theme;
}
