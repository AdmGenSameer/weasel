const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  phoneSchema,
  passwordSchema,
  amountSchema,
  upiAddressSchema,
} = require("../../work/test-dist/validation.cjs");

test("login inputs accept valid values and reject malformed input", () => {
  assert.equal(phoneSchema.safeParse("+91 90000 00001").success, true);
  assert.equal(phoneSchema.safeParse("abc").success, false);
  assert.equal(passwordSchema.safeParse("DemoPass!234").success, true);
  assert.equal(passwordSchema.safeParse("short").success, false);
});

test("amount and UPI validation reject out-of-range values", () => {
  assert.equal(amountSchema.safeParse("125.50").success, true);
  assert.equal(amountSchema.safeParse("0").success, false);
  assert.equal(upiAddressSchema.safeParse("name@bank").success, true);
  assert.equal(upiAddressSchema.safeParse("not an address").success, false);
});
