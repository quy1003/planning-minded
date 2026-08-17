/**
 * Chạy 1 lần để sinh cặp khóa Ed25519 (JWK) cho JWT — Phase 2.
 * Không commit output — paste vào `.env` local thôi.
 *
 *   node apps/api/scripts/generate-jwt-keypair.mjs
 *   # hoặc từ apps/api: node scripts/generate-jwt-keypair.mjs
 */
import { generateKeyPairSync, randomUUID } from "node:crypto";

const { privateKey, publicKey } = generateKeyPairSync("ed25519");
const kid = randomUUID();

// Node export JWK sẵn — ngắn hơn PEM, paste 1 dòng vào .env.
const privateJwk = {
  ...privateKey.export({ format: "jwk" }),
  kid,
  alg: "EdDSA",
  use: "sig",
};
const publicJwk = {
  ...publicKey.export({ format: "jwk" }),
  kid,
  alg: "EdDSA",
  use: "sig",
};

console.log("# === Copy vào .env (KHÔNG commit giá trị thật) ===\n");
// Single quotes: JSON có dấu " bên trong, dotenv đọc ổn.
console.log(`JWT_PRIVATE_JWK='${JSON.stringify(privateJwk)}'`);
console.log("\n# === Public JWK (đối chiếu — KHÔNG paste; endpoint JWKS sẽ bỏ field d) ===\n");
console.log(JSON.stringify(publicJwk, null, 2));
console.log("\n# Private có field \"d\" — chỉ nằm trong JWT_PRIVATE_JWK ở trên.");
