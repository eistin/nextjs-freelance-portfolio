"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { FrenchFlag, USFlag } from "@/components/flags/FlagIcons";

const languages = [
  { 
    code: "fr", 
    name: "Français", 
    flag: <FrenchFlag width={18} height={13} /> 
  },
  { 
    code: "en", 
    name: "English", 
    flag: <USFlag width={18} height={13} /> 
  },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages.find((lang) => lang.code === locale);

  const handleLanguageChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 px-3 text-gray-700 hover:text-primary hover:bg-gray-100/80 transition-all duration-200 rounded-lg border border-gray-200/60 bg-white/50 backdrop-blur-sm"
      >
        <Globe className="h-4 w-4 mr-2" />
        <div className="flex items-center gap-2">
          {currentLanguage?.flag}
          <span className="text-sm font-medium">
            {currentLanguage?.code.toUpperCase()}
          </span>
        </div>
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full mt-2 right-0 z-50 min-w-[140px] bg-white/95 backdrop-blur-md rounded-xl border border-gray-200/60 shadow-lg overflow-hidden"
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50/80 transition-colors duration-200 ${
                  lang.code === locale
                    ? "bg-gray-100/80 text-primary font-medium"
                    : "text-gray-700"
                }`}
              >
                <div className="flex-shrink-0">{lang.flag}</div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{lang.name}</span>
                  <span className="text-xs text-gray-500 uppercase">
                    {lang.code}
                  </span>
                </div>
                {lang.code === locale && (
                  <motion.div
                    layoutId="activeLanguage"
                    className="ml-auto w-2 h-2 rounded-full bg-primary"
                    transition={{ duration: 0.2 }}
                  />
                )}
              </button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}