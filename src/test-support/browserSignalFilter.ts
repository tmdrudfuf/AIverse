export type BrowserConsoleSignal = {
  type: string;
  text: string;
};

type AllowedWarning = {
  label: string;
  matches: (text: string) => boolean;
};

export const ALLOWED_BROWSER_CONSOLE_WARNINGS: readonly AllowedWarning[] = [
  {
    label: "Chromium software WebGL fallback deprecation notice",
    matches: (text) =>
      /\bWebGL\b/i.test(text) &&
      /Software WebGL has been deprecated/i.test(text),
  },
  {
    label: "Chromium WebGL ReadPixels performance stall notice",
    matches: (text) =>
      /\bWebGL\b/i.test(text) &&
      /GL Driver Message/i.test(text) &&
      /\bPerformance\b/i.test(text) &&
      /GPU stall due to ReadPixels/i.test(text),
  },
];

export function formatBrowserConsoleFailureSignal(
  signal: BrowserConsoleSignal,
): string | null {
  if (signal.type === "warning") {
    const isAllowed = ALLOWED_BROWSER_CONSOLE_WARNINGS.some((allowedWarning) =>
      allowedWarning.matches(signal.text),
    );

    return isAllowed ? null : `console warning: ${signal.text}`;
  }

  if (signal.type === "error") {
    return `console error: ${signal.text}`;
  }

  return null;
}

export function formatPageErrorFailureSignal(message: string): string {
  return `page error: ${message}`;
}
