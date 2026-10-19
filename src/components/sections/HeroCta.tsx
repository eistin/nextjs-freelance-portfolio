"use client";

import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/lib/analytics";

/**
 * The hero's primary call to action, split out of the server-rendered hero so
 * the click can be tracked. The label arrives already translated, so this
 * component carries no i18n of its own.
 */
export function HeroCta({ href, label }: { href: string; label: string }) {
  const { trackButtonClick } = useAnalytics();

  return (
    <Button asChild size="lg" className="px-8">
      <a href={href} onClick={() => trackButtonClick("hero_cta", href)}>
        {label}
      </a>
    </Button>
  );
}
