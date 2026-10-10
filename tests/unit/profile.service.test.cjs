const { test } = require("node:test");
const assert = require("node:assert/strict");
const argon2 = require("argon2");
const { ProfileService } = require("../../apps/api/dist/profile/profile.service.js");

test("PIN setup verifies the account password and stores only an Argon2 hash", async () => {
  const stored = {
    passwordHash: await argon2.hash("DemoPass!234"),
    status: "ACTIVE",
    pinHash: null,
  };
  const prisma = {
    user: {
      findUnique: async () => ({
        id: "user-id",
        passwordHash: stored.passwordHash,
        status: stored.status,
      }),
      update: async ({ data }) => Object.assign(stored, data),
    },
  };
  const service = new ProfileService(prisma);
  await service.setPin("user-id", "DemoPass!234", "123456");
  assert.notEqual(stored.pinHash, "123456");
  assert.equal(await argon2.verify(stored.pinHash, "123456"), true);
  await assert.rejects(service.setPin("user-id", "wrong-password", "654321"), { status: 401 });
  assert.equal(await argon2.verify(stored.pinHash, "123456"), true);
});
