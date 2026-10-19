import { routing } from "@/i18n/routing";

/**
 * Every hostname the site serves. Source of truth: deploy/httproute.yaml.
 * If you add a hostname there, add it here too, or visits arriving from it
 * will be counted as referrals from "another site". Each entry also matches
 * its www. form.
 */
const SITE_HOSTS: ReadonlySet<string> = new Set([
  "portfolio.edwindev.cloud",
  "edwindev.cloud",
  "theclouds.dev",
]);

function isSiteHost(hostname: string): boolean {
  return SITE_HOSTS.has(hostname.replace(/^www\./, ""));
}

const BOT_PATTERN =
  /bot|crawl|spider|slurp|headless|lighthouse|curl|wget|preview|monitor/i;

/** An empty user agent is treated as a bot: real browsers always send one. */
export function isBot(userAgent: string): boolean {
  return userAgent === "" || BOT_PATTERN.test(userAgent);
}

export function deviceFromUserAgent(
  userAgent: string,
): "desktop" | "mobile" | "tablet" {
  if (/ipad|tablet/i.test(userAgent)) return "tablet";
  // Android phones say "Mobile"; Android tablets do not.
  if (/android/i.test(userAgent)) {
    return /mobile/i.test(userAgent) ? "mobile" : "tablet";
  }
  if (/iphone|ipod|mobile/i.test(userAgent)) return "mobile";
  return "desktop";
}

const SOURCE_RULES: Array<[label: string, host: RegExp]> = [
  ["linkedin", /(^|\.)(linkedin\.com|lnkd\.in)$/],
  ["google", /(^|\.)google\.[a-z]{2,3}(\.[a-z]{2})?$/],
  ["malt", /(^|\.)malt\.[a-z]{2,3}$/],
];

export function classifySource(
  referrer: string | null,
  utmSource: string | null,
): { source: string; referrerHost: string | null } {
  let host: string | null = null;
  if (referrer) {
    try {
      const parsed = new URL(referrer).hostname.toLowerCase();
      // Same-origin navigation is not a traffic source.
      if (parsed && !isSiteHost(parsed)) {
        host = parsed;
      }
    } catch {
      host = null;
    }
  }

  if (utmSource) return { source: utmSource, referrerHost: host };
  if (host === null) return { source: "direct", referrerHost: null };

  for (const [label, pattern] of SOURCE_RULES) {
    if (pattern.test(host)) return { source: label, referrerHost: host };
  }
  return { source: host.replace(/^www\./, ""), referrerHost: host };
}

/** Strips query, fragment, locale prefix and trailing slash. */
export function normalisePath(rawUrl: string): string {
  let pathname: string;
  try {
    pathname = new URL(rawUrl, "http://localhost").pathname;
  } catch {
    return rawUrl;
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && routing.locales.some((l) => l === segments[0])) {
    segments.shift();
  }
  return "/" + segments.join("/");
}
