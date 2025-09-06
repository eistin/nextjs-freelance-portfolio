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
import { motion, useScroll, useTransform } from "framer-motion";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Header() {
  const t = useTranslations("navigation");
  const params = useParams();
  const locale = params.locale as string;
  const [isOpen, setIsOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  const { scrollY } = useScroll();
  const headerBackground = useTransform(
    scrollY,
    [0, 100],
    ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.95)"]
  );

  const headerShadow = useTransform(
    scrollY,
    [0, 100],
    ["0px 0px 0px rgba(0,0,0,0)", "0px 4px 30px rgba(0,0,0,0.1)"]
  );

  const headerBorderRadius = useTransform(scrollY, [0, 100], ["0px", "24px"]);

  const headerPadding = useTransform(scrollY, [0, 100], ["0px", "8px"]);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
    <motion.header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        padding: headerPadding,
      }}
    >
      <motion.div
        className="mx-auto transition-all duration-300"
        style={{
          background: headerBackground,
          boxShadow: headerShadow,
          borderRadius: headerBorderRadius,
          maxWidth: hasScrolled ? "calc(100% - 32px)" : "100%",
          marginLeft: hasScrolled ? "16px" : "0",
          marginRight: hasScrolled ? "16px" : "0",
        }}
      >
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => scrollToSection("home")}
              className="relative w-32 h-8 cursor-pointer"
            >
              <Image
                src="/logo.svg"
                alt={t('header.logoAlt')}
                fill
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
                <Button variant="ghost" size="icon" className="relative">
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
                      className="object-contain"
                    />
                  </div>
                </div>
                
                {/* Navigation Items */}
                <nav className="flex flex-col px-6 py-8">
                  {navItems.map((item, index) => (
                    <motion.button
                      key={item}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                      className="group flex items-center justify-between py-4 text-left border-b border-gray-100"
                      onClick={() => {
                        scrollToSection(item);
                        setIsOpen(false);
                      }}
                    >
                      <span className="text-lg font-medium text-gray-900 group-hover:text-primary transition-colors uppercase tracking-wider">
                        {t(item)}
                      </span>
                      <motion.div
                        className="w-2 h-2 rounded-full bg-gray-300 group-hover:bg-primary transition-colors"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      />
                    </motion.button>
                  ))}
                  
                  {/* Blog Button for Mobile */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: navItems.length * 0.1, duration: 0.3 }}
                    className="py-4 border-b border-gray-100 last:border-b-0"
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
                  </motion.div>
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
      </motion.div>
    </motion.header>
  );
}
