/** Khớp AuthUser Nest (không passwordHash). */
export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
};

/** Response của /auth/login, /auth/register (task #6 — trả JWT thay vì set session cookie). */
export type AuthTokenResponse = {
  accessToken: string;
  user: AuthUser;
};
