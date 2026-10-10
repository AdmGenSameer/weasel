const { test } = require("node:test");
const assert = require("node:assert/strict");
const { validateDepositAmount } = require("../../apps/api/dist/deposits/deposit-rules.js");

test("INR deposits must match a listed offer for the selected category", () => {
  assert.equal(validateDepositAmount("INR", 485, "Payment"), true);
  assert.equal(validateDepositAmount("INR", 24000, "VIP"), true);
  assert.equal(validateDepositAmount("INR", 486, "Payment"), false);
  assert.equal(validateDepositAmount("INR", 24000, "Payment"), false);
  assert.equal(validateDepositAmount("INR", 465), false);
});

test("USDT deposits enforce the local supported range", () => {
  assert.equal(validateDepositAmount("USDT", 1), true);
  assert.equal(validateDepositAmount("USDT", 10000), true);
  assert.equal(validateDepositAmount("USDT", 0.99), false);
  assert.equal(validateDepositAmount("USDT", 10000.01), false);
});
