"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function HeroSection() {
  const t = useTranslations("hero");
  const tLogos = useTranslations("companyLogos");

  const companyLogos = [
    { key: "alivio", src: "/logo_companies/alivio_logo.png", alt: tLogos("alivio") },
    {
      key: "breteuil",
      src: "/logo_companies/breteuil_logo.svg",
      alt: tLogos("breteuil"),
    },
    {
      key: "lemonde",
      src: "/logo_companies/le_monde_logo.svg",
      alt: tLogos("lemonde"),
    },
    { key: "leoai", src: "/logo_companies/leoai_logo.svg", alt: tLogos("leoai") },
    { key: "loreal", src: "/logo_companies/loreal_logo.svg", alt: tLogos("loreal") },
    { key: "nexelec", src: "/logo_companies/nexelec_logo.svg", alt: tLogos("nexelec") },
    {
      key: "skeepers",
      src: "/logo_companies/skeepers_logo.svg",
      alt: tLogos("skeepers"),
    },
  ];

  return (
    <section className="container mx-auto min-h-[calc(100vh-8rem)] flex flex-col justify-center relative">
      {/* Centered Content */}
      <div className="text-center max-w-4xl mx-auto">
        {/* Profile Image - Above the title */}
        <motion.div
          className="w-32 h-32 lg:w-48 lg:h-48 mx-auto mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <Image
            src="/photo.svg"
            alt="Profile"
            width={192}
            height={192}
            className="w-full h-full object-contain"
          />
        </motion.div>

        <motion.h1
          className="text-5xl lg:text-7xl font-bold mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {t("title")}
          <br />
          {t("subtitle")}
        </motion.h1>

        <motion.p
          className="text-lg mb-8 text-muted-foreground max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {t("description")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Button 
            size="lg" 
            className="px-8 cursor-pointer"
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
          >
            {t("cta")}
          </Button>
        </motion.div>
      </div>

      {/* Company Logos Infinite Carousel with Fade */}
      <motion.div
        className="mt-20 relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        {/* Fade gradients */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        {/* Carousel Container */}
        <div className="overflow-hidden w-full relative">
          <motion.div
            className="flex"
            animate={{
              x: ["0%", "-100%"],
            }}
            transition={{
              duration: 30,
              ease: "linear",
              repeat: Infinity,
            }}
          >
            {/* Duplicated content */}
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-16 shrink-0 px-8">
                {companyLogos.map((company) => (
                  <div
                    key={`${company.key}-${i}`}
                    className="flex-shrink-0 h-12 flex items-center"
                  >
                    <Image
                      src={company.src}
                      alt={company.alt}
                      width={120}
                      height={48}
                      className="h-full w-auto object-contain filter grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                    />
                  </div>
                ))}
              </div>
            ))}
          </motion.div>

          {/* Gradient Fades */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        </div>
      </motion.div>
    </section>
  );
}
