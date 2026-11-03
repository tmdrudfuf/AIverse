/**
 * Shared same-origin/loopback guard for every route under `app/api/runtime/`.
 * Comparing `Origin` to `Host` alone is not enough -- a DNS-rebinding page
 * served from `attacker.example` (resolved to 127.0.0.1) sends
 * `Host: attacker.example` and `Origin: https://attacker.example`, which
 * match each other while still not being this machine. `Host` itself must
 * independently be a loopback name (round-2 independent review finding
 * P2-001).
 */
export function isLocalHostHeader(hostHeader: string | null): boolean {
  if (!hostHeader) return false;
  if (hostHeader.startsWith("[")) {
    const closing = hostHeader.indexOf("]");
    return closing !== -1 && hostHeader.slice(0, closing + 1) === "[::1]";
  }
  const hostname = hostHeader.split(":")[0];
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/**
 * `Sec-Fetch-Site` (sent by all modern browsers) is authoritative when
 * present. Falling back to comparing `Origin` against `Host` covers
 * older/non-browser same-origin callers; a request with neither header
 * (e.g. a same-process server-to-server call, or curl) is allowed,
 * matching how browsers omit `Origin` for some same-origin requests too.
 * Requiring `Host` to be loopback as well is what actually defeats DNS
 * rebinding.
 */
export function isTrustedRuntimeBridgeRequest(request: Request): boolean {
  if (!isLocalHostHeader(request.headers.get("host"))) return false;
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite) return secFetchSite === "same-origin" || secFetchSite === "none";
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}
