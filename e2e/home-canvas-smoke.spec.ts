import { expect, test } from "@playwright/test";

test("home route boots the city canvas in Chromium without browser error signals", async ({
  page,
}) => {
  const browserSignals: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "warning" || message.type() === "error") {
      browserSignals.push(`console ${message.type()}: ${message.text()}`);
    }
  });

  page.on("pageerror", (error) => {
    browserSignals.push(`page error: ${error.message}`);
  });

  await page.goto("/");

  const canvasHost = page.locator(".city-scene-canvas");
  await expect(canvasHost).toBeVisible();
  await expect(canvasHost.locator("canvas")).toBeVisible();

  expect(browserSignals).toEqual([]);
});
