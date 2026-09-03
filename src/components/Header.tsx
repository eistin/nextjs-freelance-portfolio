"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Menu, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Header() {
  const t = useTranslations("navigation");
  const params = useParams();
  const locale = params.locale as string;
  const [isOpen, setIsOpen] = useState(false);
  // Drives background/shadow/border-radius/padding (was useTransform([0,100])).
  const [scrolled, setScrolled] = useState(false);
  // Drives the header-narrowing maxWidth/margin (was the original hasScrolled effect).
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 100);
      setHasScrolled(window.scrollY > 20);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = ["home", "services", "projects", "about", "contact"];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 80; // Account for fixed header height
      const elementPosition = element.offsetTop - headerHeight;

      window.scrollTo({
        top: elementPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "p-2" : "p-0"
      )}
    >
      <div
        className={cn(
          "mx-auto transition-all duration-300",
          scrolled
            ? "bg-white/95 shadow-[0_4px_30px_rgba(0,0,0,0.1)] rounded-3xl"
            : "bg-transparent shadow-none rounded-none",
          hasScrolled
            ? "max-w-[calc(100%-32px)] mx-4"
            : "max-w-full mx-0"
        )}
      >
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => scrollToSection("home")}
              className="relative w-32 h-8 cursor-pointer"
              aria-label={t('header.logoAlt')}
            >
              <Image
                src="/logo.svg"
                alt={t('header.logoAlt')}
                fill
                priority
                className="object-contain"
              />
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <NavigationMenu>
                <NavigationMenuList>
                  {navItems.map((item) => (
                    <NavigationMenuItem key={item}>
                      <NavigationMenuLink
                        className="px-4 py-2 hover:text-primary transition-colors cursor-pointer"
                        onClick={() => scrollToSection(item)}
                        role="button"
                        aria-label={`${t('header.navigateTo')} ${t(item)}`}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            scrollToSection(item);
                          }
                        }}
                      >
                        {t(item)}
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>

              {/* Blog Button - Different Style */}
              <Link href={`/${locale}/blog`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary text-primary hover:bg-primary hover:text-white transition-all duration-200 gap-2 cursor-pointer"
                >
                  {t('blog')}
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </Link>

              <LanguageSwitcher />
            </div>

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="relative" aria-label={t('header.menuAria')}>
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[320px] p-0 bg-white/95 backdrop-blur-lg border-l border-gray-200/50">
                {/* Header with Logo */}
                <div className="px-6 py-6 border-b border-gray-200/50">
                  <div className="relative w-24 h-6">
                    <Image
                      src="/logo.svg"
                      alt={t('header.logoAlt')}
                      fill
                      priority
                      className="object-contain"
                    />
                  </div>
                </div>

                {/* Navigation Items */}
                <nav className="flex flex-col px-6 py-8">
                  {navItems.map((item, index) => (
                    <button
                      key={item}
                      className="group flex items-center justify-between py-4 text-left border-b border-gray-100 w-full cursor-pointer animate-in fade-in slide-in-from-right-4"
                      style={{ animationDelay: `${index * 100}ms`, animationFillMode: "both" }}
                      onClick={() => {
                        scrollToSection(item);
                        setIsOpen(false);
                      }}
                    >
                      <span className="text-lg font-medium text-gray-900 group-hover:text-primary transition-colors uppercase tracking-wider">
                        {t(item)}
                      </span>
                      <div className="w-2 h-2 rounded-full bg-gray-300 group-hover:bg-primary transition-colors transition-transform hover:scale-125 active:scale-90" />
                    </button>
                  ))}

                  {/* Blog Button for Mobile */}
                  <div
                    className="py-4 border-b border-gray-100 last:border-b-0 animate-in fade-in slide-in-from-right-4"
                    style={{ animationDelay: `${navItems.length * 100}ms`, animationFillMode: "both" }}
                  >
                    <Link href={`/${locale}/blog`} onClick={() => setIsOpen(false)}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-primary text-primary hover:bg-primary hover:text-white transition-all duration-200 gap-2 w-full cursor-pointer"
                      >
                        {t('blog')}
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </nav>

                {/* Language Switcher for Mobile */}
                <div className="px-6 py-4 border-t border-gray-200/50">
                  <LanguageSwitcher />
                </div>

                {/* Footer Info */}
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">{t('header.name')}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">
                      {t('header.tagline')}
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </header>
  );
}
