# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home-canvas-smoke.spec.ts >> home route boots the city canvas in Chromium without unexpected browser signals
- Location: e2e\home-canvas-smoke.spec.ts:8:5

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 3

- Array []
+ Array [
+   "console warning: [.WebGL-0x7b6c00a1c200]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels",
+ ]
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - paragraph [ref=e5]: DISTRICT 01 / COMPANY CAMPUS
        - heading "AI CITY" [level=1] [ref=e6]
      - generic [ref=e7]: CITY VIEW
    - region [ref=e9]:
      - generic [ref=e10]:
        - generic [ref=e11]:
          - paragraph [ref=e12]: SPRINT 04
          - heading "Company District" [level=2] [ref=e13]
        - generic [ref=e14]:
          - generic [ref=e15]:
            - generic [ref=e16]: ACTIVE COMPANY
            - generic [ref=e18]: FUTURE SITE
          - generic [ref=e20]:
            - generic [ref=e21]: "Move: WASD / Arrow Keys"
            - generic [ref=e22]: "Zoom: Q / E / Mouse Wheel"
      - img "Pixel-art city with roads, sidewalks, grass, trees, Daily Proof Inc., AI Lab, and Portfolio Studio" [ref=e23]
      - generic [ref=e25]:
        - generic [ref=e26]: 3 BUILDINGS
        - strong [ref=e27]: DAILY PROOF INC. IS ACTIVE
        - generic [ref=e28]: CAMERA ONLINE
  - button "Open Next.js Dev Tools" [ref=e34] [cursor=pointer]
  - alert [ref=e38]
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | import {
  4  |   formatBrowserConsoleFailureSignal,
  5  |   formatPageErrorFailureSignal,
  6  | } from "../src/test-support/browserSignalFilter";
  7  | 
  8  | test("home route boots the city canvas in Chromium without unexpected browser signals", async ({
  9  |   page,
  10 | }) => {
  11 |   const browserSignals: string[] = [];
  12 | 
  13 |   page.on("console", (message) => {
  14 |     const failureSignal = formatBrowserConsoleFailureSignal({
  15 |       type: message.type(),
  16 |       text: message.text(),
  17 |     });
  18 | 
  19 |     if (failureSignal) {
  20 |       browserSignals.push(failureSignal);
  21 |     }
  22 |   });
  23 | 
  24 |   page.on("pageerror", (error) => {
  25 |     browserSignals.push(formatPageErrorFailureSignal(error.message));
  26 |   });
  27 | 
  28 |   await page.goto("/");
  29 | 
  30 |   const canvasHost = page.locator(".city-scene-canvas");
  31 |   await expect(canvasHost).toBeVisible();
  32 |   await expect(canvasHost.locator("canvas")).toBeVisible();
  33 | 
> 34 |   expect(browserSignals).toEqual([]);
     |                          ^ Error: expect(received).toEqual(expected) // deep equality
  35 | });
  36 | 
```