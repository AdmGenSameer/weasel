const { test } = require("node:test");
const assert = require("node:assert/strict");
const { AuthService } = require("../../apps/api/dist/auth/auth.service.js");

test("unknown phone numbers cannot create authenticated sessions", async () => {
  const prisma = {
    user: { findUnique: async () => null },
    refreshSession: { create: async () => assert.fail("session must not be created") },
  };
  const service = new AuthService(prisma, {});
  await assert.rejects(service.login("9000000001", "DemoPass!234"), { status: 401 });
});

test("mock recovery codes limit attempts and are consumed on success", async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousSmsMode = process.env.SMS_MODE;
  process.env.NODE_ENV = "development";
  process.env.SMS_MODE = "mock";
  try {
    const updates = [];
    const prisma = {
      user: {
        findUnique: async () => ({ id: "user-id" }),
        update: (args) => {
          updates.push(args);
          return Promise.resolve({});
        },
      },
      refreshSession: {
        updateMany: (args) => {
          updates.push(args);
          return Promise.resolve({ count: 1 });
        },
      },
      $transaction: (operations) => Promise.all(operations),
    };
    const service = new AuthService(prisma, {});
    const { mockCode } = await service.startRecovery("9000000001");
    assert.match(mockCode, /^\d{6}$/);
    const wrongCode = mockCode === "000000" ? "000001" : "000000";
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await assert.rejects(service.completeRecovery("9000000001", wrongCode, "NewDemoPass!234"), {
        status: 401,
      });
    }
    await assert.rejects(service.completeRecovery("9000000001", mockCode, "NewDemoPass!234"), {
      status: 401,
    });
    const next = await service.startRecovery("9000000001");
    assert.match(next.mockCode, /^\d{6}$/);
    await service.completeRecovery("9000000001", next.mockCode, "NewDemoPass!234");
    assert.equal(updates.length, 2);
    await assert.rejects(service.completeRecovery("9000000001", next.mockCode, "NewDemoPass!234"), {
      status: 401,
    });
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousSmsMode === undefined) delete process.env.SMS_MODE;
    else process.env.SMS_MODE = previousSmsMode;
  }
});
