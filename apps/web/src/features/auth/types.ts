/** Khớp AuthUser Nest (không passwordHash). */
export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
};
