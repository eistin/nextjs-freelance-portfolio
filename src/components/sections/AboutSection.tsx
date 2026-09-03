import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { Award, Briefcase, Users, ArrowUpRight } from "lucide-react";

export default async function AboutSection() {
  const t = await getTranslations("about");

  const stats = [
    {
      key: "experience",
      number: t("stats.experience.number"),
      label: t("stats.experience.label"),
      icon: Award,
    },
    {
      key: "projects",
      number: t("stats.projects.number"),
      label: t("stats.projects.label"),
      icon: Briefcase,
    },
    {
      key: "satisfaction",
      number: t("stats.satisfaction.number"),
      label: t("stats.satisfaction.label"),
      icon: Users,
    },
  ];

  return (
    <section className="container mx-auto">
      <Reveal as="h2" className="text-4xl font-bold text-center mb-16">
        {t("title")}
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-start">
        {/* Left side - Image and visual elements */}
        <Reveal className="hidden lg:block lg:col-span-2 relative">
          {/* Decorative background element */}
          <div className="absolute inset-0 -z-10 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1px)`,
                backgroundSize: "32px 32px",
              }}
            />
          </div>

          {/* Main profile image */}
          <div className="relative aspect-square max-w-sm mx-auto lg:mx-0 transition-transform hover:scale-[1.02]">
            {/* Gradient background for depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 rounded-2xl -z-10" />

            {/* Image container with modern styling */}
            <div className="relative overflow-hidden rounded-2xl">
              <Image
                src="/photo.webp"
                alt="Edwin Istin, DevOps and SRE Engineer"
                width={400}
                height={400}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </Reveal>

        {/* Right side - Content */}
        <div className="col-span-1 lg:col-span-3">
          <Reveal className="mb-12">
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t("description")}
            </p>
          </Reveal>

          {/* Stats grid with improved design */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Reveal key={stat.key} delayMs={index * 150} className="group">
                  <Card className="relative h-full hover:shadow-lg transition-all duration-500 border border-border hover:border-primary/50 overflow-hidden">
                    {/* Subtle pattern background */}
                    <div className="absolute inset-0 opacity-[0.015]">
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1px)`,
                          backgroundSize: "20px 20px",
                        }}
                      />
                    </div>

                    <CardContent className="relative z-10 p-6 text-center">
                      {/* Icon with improved styling */}
                      <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-transform group-hover:scale-105">
                        <Icon className="w-7 h-7 text-primary" />
                      </div>

                      {/* Number */}
                      <h3 className="text-3xl lg:text-4xl font-bold text-primary mb-2">
                        {stat.number}
                      </h3>

                      <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                        {stat.label}
                      </p>

                      {/* Hover indicator */}
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight className="w-4 h-4 text-primary" />
                      </div>

                      {/* Accent line */}
                      <div className="absolute left-0 top-0 w-1 h-full bg-primary rounded-r-full" />
                    </CardContent>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
