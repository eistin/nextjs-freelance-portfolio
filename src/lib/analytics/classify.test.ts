import { describe, expect, test, vi } from "vitest";
import {
  classifySource,
  deviceFromUserAgent,
  isBot,
  normalisePath,
} from "./classify";

// A locale list that differs from the real one, to prove normalisePath reads it.
vi.mock("@/i18n/routing", () => ({
  routing: { locales: ["fr", "en", "de"] },
}));

const FIREFOX =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:128.0) Gecko/20100101 Firefox/128.0";

describe("isBot", () => {
  const SPEC_LIST = [
    "Mozilla/5.0 (compatible; SomeBot/1.0)",
    "Mozilla/5.0 (compatible; Crawler/2.0)",
    "Mozilla/5.0 (compatible; Spider/1.0)",
    "Mozilla/5.0 (compatible; Yahoo! Slurp)",
    "Mozilla/5.0 HeadlessChrome/120.0",
    "Mozilla/5.0 Chrome-Lighthouse",
    "curl/8.4.0",
    "Wget/1.21",
    "Slack-LinkPreview",
    "UptimeMonitor/1.0",
  ];

  test("rejects the spec list", () => {
    for (const ua of SPEC_LIST) {
      expect(isBot(ua), ua).toBe(true);
    }
  });

  test("matches case-insensitively", () => {
    expect(
      isBot("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"),
    ).toBe(true);
    expect(isBot("Googlebot/2.1")).toBe(true);
    expect(isBot("CURL/8.0")).toBe(true);
  });

  test("accepts an ordinary browser", () => {
    expect(isBot(FIREFOX)).toBe(false);
  });

  test("treats an empty user agent as a bot", () => {
    expect(isBot("")).toBe(true);
  });
});

describe("deviceFromUserAgent", () => {
  test("buckets an iPhone as mobile", () => {
    expect(
      deviceFromUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
      ),
    ).toBe("mobile");
  });

  test("buckets an iPad as tablet", () => {
    expect(
      deviceFromUserAgent(
        "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
      ),
    ).toBe("tablet");
  });

  test("buckets an Android phone as mobile", () => {
    expect(
      deviceFromUserAgent(
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36",
      ),
    ).toBe("mobile");
  });

  test("buckets a desktop as desktop", () => {
    expect(deviceFromUserAgent(FIREFOX)).toBe("desktop");
  });

  test("buckets an Android tablet (no Mobile token) as tablet", () => {
    expect(
      deviceFromUserAgent(
        "Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
      ),
    ).toBe("tablet");
  });

  test("buckets an explicit tablet token as tablet", () => {
    expect(deviceFromUserAgent("Mozilla/5.0 (X11; Linux) Tablet Browser/1.0")).toBe(
      "tablet",
    );
  });

  test("falls back to desktop for an unrecognised agent", () => {
    expect(deviceFromUserAgent("")).toBe("desktop");
    expect(deviceFromUserAgent("SomethingOdd/1.0")).toBe("desktop");
  });
});

describe("classifySource", () => {
  test("empty referrer is direct", () => {
    expect(classifySource(null, null)).toEqual({
      source: "direct",
      referrerHost: null,
    });
    expect(classifySource("", null)).toEqual({
      source: "direct",
      referrerHost: null,
    });
  });

  test("same-origin referrer is direct", () => {
    expect(classifySource("https://edwindev.cloud/blog", null)).toEqual({
      source: "direct",
      referrerHost: null,
    });
  });

  test("linkedin.com is linkedin", () => {
    expect(classifySource("https://www.linkedin.com/feed/", null)).toEqual({
      source: "linkedin",
      referrerHost: "www.linkedin.com",
    });
  });

  test("lnkd.in is linkedin", () => {
    expect(classifySource("https://lnkd.in/abc123", null)).toEqual({
      source: "linkedin",
      referrerHost: "lnkd.in",
    });
  });

  test("www.google.fr is google", () => {
    expect(classifySource("https://www.google.fr/", null)).toEqual({
      source: "google",
      referrerHost: "www.google.fr",
    });
  });

  test("google.co.uk is google", () => {
    expect(classifySource("https://google.co.uk/search?q=x", null)).toEqual({
      source: "google",
      referrerHost: "google.co.uk",
    });
  });

  test("malt.fr is malt", () => {
    expect(classifySource("https://www.malt.fr/profile/edwin", null)).toEqual({
      source: "malt",
      referrerHost: "www.malt.fr",
    });
  });

  test("an unknown host keeps its bare host", () => {
    expect(
      classifySource("https://news.ycombinator.com/item?id=1", null),
    ).toEqual({
      source: "news.ycombinator.com",
      referrerHost: "news.ycombinator.com",
    });
  });

  test("strips www. from an unknown host source but keeps it in referrerHost", () => {
    expect(classifySource("https://www.example.org/post", null)).toEqual({
      source: "example.org",
      referrerHost: "www.example.org",
    });
  });

  test("www.edwindev.cloud is same-origin and direct", () => {
    expect(classifySource("https://www.edwindev.cloud/blog", null)).toEqual({
      source: "direct",
      referrerHost: null,
    });
  });

  test.each([
    "https://portfolio.edwindev.cloud/blog",
    "https://edwindev.cloud/blog",
    "https://theclouds.dev/blog",
    "https://www.theclouds.dev/blog",
    "https://www.portfolio.edwindev.cloud/blog",
  ])("referrer from own hostname %s is direct", (referrer) => {
    expect(classifySource(referrer, null)).toEqual({
      source: "direct",
      referrerHost: null,
    });
  });

  test("same-origin referrer with utm_source: utm wins, host is null", () => {
    expect(
      classifySource("https://edwindev.cloud/blog", "newsletter"),
    ).toEqual({ source: "newsletter", referrerHost: null });
  });

  test("utm_source wins over the referrer", () => {
    expect(
      classifySource("https://www.google.fr/", "newsletter"),
    ).toEqual({ source: "newsletter", referrerHost: "www.google.fr" });
    expect(classifySource(null, "newsletter")).toEqual({
      source: "newsletter",
      referrerHost: null,
    });
  });

  test("a malformed referrer does not throw", () => {
    expect(classifySource("not a url", null)).toEqual({
      source: "direct",
      referrerHost: null,
    });
  });
});

describe("normalisePath", () => {
  test("strips the fr locale prefix", () => {
    expect(normalisePath("/fr/blog")).toBe("/blog");
  });

  test("strips the en locale prefix", () => {
    expect(normalisePath("/en/blog")).toBe("/blog");
  });

  test("reads the locale list from routing, not a hardcoded pair", () => {
    expect(normalisePath("/de/blog")).toBe("/blog");
  });

  test("leaves an unprefixed path alone", () => {
    expect(normalisePath("/blog")).toBe("/blog");
  });

  test("maps a bare locale root to /", () => {
    expect(normalisePath("/en")).toBe("/");
    expect(normalisePath("/en/")).toBe("/");
  });

  test("drops the query string entirely", () => {
    expect(normalisePath("/blog?utm_source=x")).toBe("/blog");
  });

  test("drops the fragment", () => {
    expect(normalisePath("/blog#section")).toBe("/blog");
  });

  test("does not mistake a path segment for a locale", () => {
    expect(normalisePath("/english-notes")).toBe("/english-notes");
    expect(normalisePath("/fr-notes/en")).toBe("/fr-notes/en");
  });

  test("collapses a trailing slash", () => {
    expect(normalisePath("/blog/")).toBe("/blog");
    expect(normalisePath("/")).toBe("/");
  });
});
