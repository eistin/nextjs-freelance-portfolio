"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: React.ReactNode;
  as?: keyof React.JSX.IntrinsicElements;
  delayMs?: number;
  className?: string;
};

export function Reveal({ children, as = "div", delayMs = 0, className }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "-100px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const Tag = as as React.ElementType;
  return (
    <Tag
      ref={ref}
      className={cn("reveal", visible && "reveal-visible", className)}
      style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
