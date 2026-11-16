import type { Http } from './http';

/** A sessão que o cadastro, o login e a renovação devolvem (README do back, "API de autenticação"). */
export type SessionUser = { id: string; email: string; role: string; studentId: string | null };

export type AuthSession = {
  accessToken: string;
  accessTokenExpiresAt: string;
  /** Só aparece nesta resposta, e cada renovação troca por um novo: o usado deixa de valer. */
  refreshToken: string;
  user: SessionUser;
};

/** Os endpoints abertos da API: não levam access token. */
export type AuthApi = {
  register(request: { name: string; email: string; password: string }): Promise<AuthSession>;
  login(request: { email: string; password: string }): Promise<AuthSession>;
  refresh(refreshToken: string): Promise<AuthSession>;
  logout(refreshToken: string): Promise<void>;
};

export function createHttpAuthApi(http: Http): AuthApi {
  return {
    register: (request) => http.post('/auth/register', request),
    login: (request) => http.post('/auth/login', request),
    refresh: (refreshToken) => http.post('/auth/refresh', { refreshToken }),
    logout: (refreshToken) => http.post('/auth/logout', { refreshToken }),
  };
}
