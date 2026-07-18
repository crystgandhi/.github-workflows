import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("reset-sandbox").click();
});

test("searches products and opens product details", async ({ page }) => {
  await page.getByTestId("product-search").fill("Peony");
  await expect(page.getByTestId("product-list").locator("article")).toHaveCount(1);
  await page.getByTestId("view-peony-cloud").click();
  await expect(page.getByTestId("product-details")).toContainText("Peony Cloud");
  await page.getByTestId("back-to-products").click();
  await expect(page.getByTestId("product-list")).toBeVisible();
});

test("persists wishlist selection and displays the saved item", async ({ page }) => {
  const heart = page.getByTestId("wishlist-peony-cloud");
  await heart.click();
  await expect(heart).toHaveAttribute("aria-pressed", "true");
  await page.getByTestId("view-wishlist").click();
  await expect(page.getByTestId("wishlist-item-peony-cloud")).toBeVisible();
});

test("updates cart quantity and completes checkout", async ({ page }) => {
  await page.getByTestId("add-coral-charm").click();
  await page.getByTestId("view-cart").click();
  await expect(page.getByTestId("cart-subtotal")).toHaveText("$59.00");
  await page.getByLabel("Increase Coral Charm quantity").click();
  await expect(page.getByTestId("cart-subtotal")).toHaveText("$118.00");
  await page.getByTestId("proceed-checkout").click();
  await page.getByTestId("checkout-email").fill("tester@example.com");
  await page.getByTestId("first-name").fill("Test");
  await page.getByTestId("last-name").fill("Customer");
  await page.getByTestId("address-line").fill("123 Flower Lane");
  await page.getByTestId("city").fill("Columbia");
  await page.getByTestId("state").fill("Maryland");
  await page.getByTestId("postal-code").fill("21044");
  await page.getByTestId("country").selectOption("United States");
  await page.getByTestId("card-name").fill("Test Customer");
  await page.getByTestId("card-number").fill("4242 4242 4242 4242");
  await page.getByTestId("card-expiry").fill("12/30");
  await page.getByTestId("card-cvc").fill("123");
  await page.getByTestId("promo-code").fill("BLOOM20");
  await page.getByTestId("apply-promo").click();
  await expect(page.getByTestId("checkout-total")).toHaveText("$94.40");
  await page.getByTestId("place-order").click();
  await expect(page.getByTestId("order-confirmation")).toBeVisible();
});

test("opens a dynamic order row", async ({ page }) => {
  await page.getByTestId("view-order-FL-1042").click();
  await expect(page.getByTestId("order-detail-panel")).toContainText("FL-1042");
  await expect(page.getByTestId("order-detail-panel")).toContainText("Maya Chen");
});

test("runs visual, chatbot, API, and accessibility scenarios", async ({ page }) => {
  await page.getByTestId("visual-variant").selectOption("none");
  await page.getByTestId("run-visual-test").click();
  await expect(page.getByTestId("visual-result")).toContainText("Passed");

  await page.getByTestId("chatbot-case-returns").click();
  await page.getByTestId("run-chatbot-test").click();
  await expect(page.getByTestId("chatbot-test-result")).toContainText("4 passed");

  await page.getByTestId("api-scenario").selectOption("empty");
  await page.getByTestId("send-api-request").click();
  await expect(page.getByTestId("api-empty")).toBeVisible();

  await page.getByTestId("a11y-condition").selectOption("label");
  await page.getByTestId("run-a11y-audit").click();
  await expect(page.getByTestId("a11y-result")).toContainText("1 accessibility violation");
});

test("cancels a pending API response when the scenario changes or sandbox resets", async ({ page }) => {
  await page.getByTestId("api-scenario").selectOption("delayed");
  await page.getByTestId("send-api-request").click();
  await expect(page.getByTestId("api-loading")).toBeVisible();
  await page.getByTestId("api-scenario").selectOption("error");
  await page.waitForTimeout(2400);
  await expect(page.getByTestId("api-ui-state")).toHaveText("State: idle");

  await page.getByTestId("api-scenario").selectOption("delayed");
  await page.getByTestId("send-api-request").click();
  await page.getByTestId("reset-sandbox").click();
  await page.waitForTimeout(2400);
  await expect(page.getByTestId("api-ui-state")).toHaveText("State: idle");
});

test("keeps the page within the viewport on desktop and mobile", async ({ page }) => {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
  await expect(page.getByRole("navigation", { name: "Advanced automation labs" })).toBeVisible();
});

test("supports keyboard-only navigation through essential controls", async ({ page }) => {
  const reached = new Set<string>();
  for (let index = 0; index < 35; index += 1) {
    await page.keyboard.press("Tab");
    const identity = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      return active?.dataset.testid || active?.getAttribute("href") || active?.getAttribute("aria-label") || "";
    });
    if (identity) reached.add(identity);
  }
  expect(reached).toContain("reset-sandbox");
  expect(reached).toContain("header-search");
  expect(reached).toContain("view-wishlist");
  expect(reached).toContain("view-cart");
  expect(reached).toContain("#visual-regression");
  expect(reached).toContain("product-search");
});
