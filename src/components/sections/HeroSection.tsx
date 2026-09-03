import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default async function HeroSection() {
  const t = await getTranslations("hero");
  const tLogos = await getTranslations("companyLogos");

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
        {/* Profile Image - Above the title - Use CSS animation instead of Framer Motion */}
        <div
          className="w-32 h-32 lg:w-48 lg:h-48 mx-auto mb-8 animate-fade-in-scale"
          style={{ aspectRatio: '1' }}
        >
          <Image
            src="/photo.webp"
            alt="Edwin Istin, DevOps and SRE Engineer"
            width={192}
            height={192}
            priority
            fetchPriority="high"
            className="w-full h-full object-contain"
          />
        </div>

        <h1
          className="text-5xl lg:text-7xl font-bold mb-6 animate-fade-in-up"
          style={{ animationDelay: '0.1s' }}
        >
          {t("title")}
          <br />
          {t("subtitle")}
        </h1>

        <p
          className="text-lg mb-8 text-muted-foreground max-w-2xl mx-auto animate-fade-in-up"
          style={{ animationDelay: '0.2s' }}
        >
          {t("description")}
        </p>

        <div
          className="animate-fade-in-up"
          style={{ animationDelay: '0.3s' }}
        >
          <Button asChild size="lg" className="px-8">
            <a href="#contact">{t("cta")}</a>
          </Button>
        </div>
      </div>

      {/* Company Logos Infinite Carousel with Fade */}
      <div
        className="mt-12 lg:mt-20 relative animate-fade-in-up"
        style={{ animationDelay: "0.8s" }}
      >
        {/* Responsive Fade gradients */}
        <div className="absolute left-0 top-0 bottom-0 w-8 lg:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 lg:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        {/* Carousel Container */}
        <div className="overflow-hidden w-full relative carousel-container">
          <div
            className="flex will-change-transform"
            style={{
              animation: 'scroll 25s linear infinite',
              width: 'fit-content'
            }}
          >
            {/* Duplicated content for infinite scroll */}
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 md:gap-6 lg:gap-16 shrink-0 px-3 md:px-4 lg:px-8">
                {companyLogos.map((company) => (
                  <div
                    key={`${company.key}-${i}`}
                    className="flex-shrink-0 h-8 md:h-10 lg:h-12 flex items-center"
                  >
                    <Image
                      src={company.src}
                      alt={company.alt}
                      width={120}
                      height={48}
                      className="h-full w-auto object-contain filter grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 max-w-[80px] md:max-w-[100px] lg:max-w-[120px]"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
