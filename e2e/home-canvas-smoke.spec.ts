import { expect, test } from "@playwright/test";

import {
  formatBrowserConsoleFailureSignal,
  formatPageErrorFailureSignal,
} from "../src/test-support/browserSignalFilter";

test("home route boots the city canvas in Chromium without unexpected browser signals", async ({
  page,
}) => {
  const browserSignals: string[] = [];

  page.on("console", (message) => {
    const failureSignal = formatBrowserConsoleFailureSignal({
      type: message.type(),
      text: message.text(),
    });

    if (failureSignal) {
      browserSignals.push(failureSignal);
    }
  });

  page.on("pageerror", (error) => {
    browserSignals.push(formatPageErrorFailureSignal(error.message));
  });

  await page.goto("/");

  const canvasHost = page.locator(".city-scene-canvas");
  await expect(canvasHost).toBeVisible();
  await expect(canvasHost.locator("canvas")).toBeVisible();

  expect(browserSignals).toEqual([]);
});
