import * as http from "node:http";
import type { UserRole } from "@tripmind/shared";
import { exportJWK, generateKeyPair, SignJWT, type KeyLike } from "jose";

export type FakeAuthService = {
  url: string;
  signAccessToken: (userId: string, role?: UserRole) => Promise<string>;
  close: () => Promise<void>;
};

/**
 * trip-service không tự ký/verify JWT (task #7 — auth-service giữ hết) — nhưng
 * JwtAuthGuard vẫn phải fetch JWKS qua HTTP THẬT (không mock jwtVerify) để test
 * đúng cơ chế offline-verify sẽ chạy trong production. Đây là bản auth-service
 * "giả" tối giản nhất có thể: tự sinh keypair test, serve đúng JWKS thật qua
 * HTTP, ký token test bằng đúng key đó.
 */
export async function startFakeAuthService(port: number): Promise<FakeAuthService> {
  const { publicKey, privateKey } = await generateKeyPair("EdDSA", { crv: "Ed25519" });
  const kid = "test-kid";
  const publicJwk = { ...(await exportJWK(publicKey as KeyLike)), kid, alg: "EdDSA", use: "sig" };

  const server = http.createServer((req, res) => {
    if (req.url === "/.well-known/jwks.json") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ keys: [publicJwk] }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  await new Promise<void>((resolve) => server.listen(port, resolve));

  return {
    url: `http://localhost:${port}`,
    signAccessToken: (userId: string, role: UserRole = "USER") =>
      new SignJWT({ role })
        .setProtectedHeader({ alg: "EdDSA", kid })
        .setSubject(userId)
        .setIssuedAt()
        .setExpirationTime("15m")
        .sign(privateKey),
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
