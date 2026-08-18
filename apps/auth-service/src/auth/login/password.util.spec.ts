import { hashPassword, verifyPassword } from "./password.util";

describe("password.util", () => {
  it("hashes and verifies the same password", async () => {
    const hash = await hashPassword("password123");
    await expect(verifyPassword(hash, "password123")).resolves.toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("password123");
    await expect(verifyPassword(hash, "wrong-password")).resolves.toBe(false);
  });

  it("produces different hashes for the same password (random salt)", async () => {
    const a = await hashPassword("password123");
    const b = await hashPassword("password123");
    expect(a).not.toEqual(b);
  });
});
