import { getLocale, getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { Reveal } from "@/components/ui/Reveal";
import { Award, Briefcase, Users, Server, TrendingUp, type LucideIcon } from "lucide-react";
import { getProfile } from "@/lib/profile";

// Layout only: which icon fronts which stat. Values and labels come from the
// profile artifact, so adding a stat there renders with the fallback icon
// rather than breaking the section.
const ICONS: Record<string, LucideIcon> = {
  experience: Award,
  missions: Briefcase,
  clients: Users,
  applications: Server,
};

export default async function AboutSection() {
  const t = await getTranslations("about");
  const profile = getProfile(await getLocale());

  return (
    <section className="container mx-auto">
      <Reveal as="h2" className="text-4xl font-bold text-center mb-8">
        {t("title")}
      </Reveal>

      <Reveal className="max-w-3xl mx-auto mb-16">
        <p className="text-lg text-muted-foreground leading-relaxed text-center">
          {profile.bio.long}
        </p>
      </Reveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {profile.stats.map((stat, index) => {
          const Icon = ICONS[stat.id] ?? TrendingUp;
          return (
            <Reveal key={stat.id} delayMs={index * 120} className="group">
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
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-all group-hover:scale-105">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>

                  <p className="text-4xl lg:text-5xl font-bold text-primary mb-2 tabular-nums">
                    {stat.value}
                  </p>

                  <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    {stat.label}
                  </p>

                  {/* Accent line */}
                  <div className="absolute left-0 top-0 w-1 h-full bg-primary rounded-r-full" />
                </CardContent>
              </Card>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
