import * as argon2 from "argon2";

/** Hash password bằng argon2id — không bao giờ lưu plaintext. */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

/** So khớp password với hash đã lưu. Không giải mã được hash → chỉ verify. */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}
