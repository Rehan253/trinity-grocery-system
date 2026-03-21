import { getApiBaseUrl } from "@/lib/config/env";

/** When API has no usable image URL */
export const PRODUCT_IMAGE_PLACEHOLDER =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=60";

const LOOPBACK_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "10.0.2.2",
  "[::1]",
]);

/**
 * If the image points at loopback but the app uses a LAN/emulator API base,
 * rewrite the origin so the phone can load the file from your machine.
 */
function rewriteLoopbackImageToApiOrigin(absoluteUrl: string): string {
  try {
    const parsed = new URL(absoluteUrl);
    if (!LOOPBACK_HOSTS.has(parsed.hostname)) {
      return absoluteUrl;
    }
    const apiBase = getApiBaseUrl().replace(/\/+$/, "");
    const withScheme = /^https?:\/\//i.test(apiBase) ? apiBase : `http://${apiBase}`;
    const api = new URL(withScheme);
    return `${api.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return absoluteUrl;
  }
}

/**
 * Turns API `picture_url` values into a full URL the app can load.
 * - Absolute http(s) → unchanged (with loopback rewrite when needed)
 * - Protocol-relative `//...` → https
 * - Root-relative `/...` → API origin + path (same host as Flask)
 * - Other relative paths → API origin + `/` + path
 */
export function resolveProductImageUrl(
  pictureUrl: string | null | undefined,
): string {
  const raw = pictureUrl?.trim();
  if (!raw || raw === "null" || raw === "undefined") {
    return PRODUCT_IMAGE_PLACEHOLDER;
  }

  if (/^https?:\/\//i.test(raw)) {
    return rewriteLoopbackImageToApiOrigin(raw);
  }

  if (raw.startsWith("//")) {
    return rewriteLoopbackImageToApiOrigin(`https:${raw}`);
  }

  const base = getApiBaseUrl().replace(/\/+$/, "");
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return `${base}${path}`;
}
