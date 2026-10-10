import { expect, test } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Phone number").fill(process.env.DEMO_USER_PHONE ?? "9000000001");
  await page.getByLabel("Password").fill(process.env.DEMO_USER_PASSWORD ?? "DemoPass!234");
  await page.getByRole("button", { name: "LOG IN" }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3000/");
}

test("login opens Home and bottom navigation reaches Deposit", async ({ page }) => {
  await login(page);
  await expect(page.getByText("Quota", { exact: true }).first()).toBeVisible();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Deposit" })
    .click();
  await expect(page).toHaveURL(/\/deposit$/);
  await expect(page.getByRole("button", { name: "USDT" })).toBeVisible();
});

test("protected route returns to login when signed out", async ({ page }) => {
  await login(page);
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Me" })
    .click();
  await page.getByRole("button", { name: /Sign Out/ }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("mobile layout keeps bottom navigation available", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(nav).toBeVisible();
  await nav.getByRole("link", { name: "UPI" }).click();
  await expect(page).toHaveURL(/\/payment$/);
});

test("mock SMS password recovery updates the local demo account", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Forget Password" }).click();
  await page.getByLabel("Phone number").fill(process.env.DEMO_USER_PHONE ?? "9000000001");
  await page.getByRole("button", { name: "Send recovery code" }).click();
  const codeText = await page
    .getByRole("status")
    .filter({ hasText: "Development SMS code:" })
    .textContent();
  const code = codeText?.match(/\b\d{6}\b/)?.[0];
  if (!code) throw new Error("Local development recovery code was not returned");
  await page.getByLabel("6-digit code").fill(code);
  await page.getByLabel("New password").fill(process.env.DEMO_USER_PASSWORD ?? "DemoPass!234");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByRole("status")).toContainText("Existing sessions have been signed out");
  await page.getByRole("button", { name: "Return to login" }).click();
  await login(page);
});

test("profile shows the signed-in user and verifies PIN updates", async ({ page }) => {
  await login(page);
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Me" })
    .click();
  await page.getByRole("button", { name: /Edit profile/ }).click();
  await expect(page.getByText("Account ID", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Set up/ }).click();
  await page.getByLabel("Current password").fill(process.env.DEMO_USER_PASSWORD ?? "DemoPass!234");
  await page.getByLabel("New six-digit PIN").fill("123456");
  await page.getByRole("button", { name: "Save PIN" }).click();
  await expect(page.getByRole("status")).toContainText("PIN has been updated");
  await expect(page.getByRole("button", { name: /Change/ })).toBeVisible();
});
