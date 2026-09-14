import { getLocale, getTranslations } from "next-intl/server";
import { Reveal } from "@/components/ui/Reveal";
import { ServiceCard, type ServiceKey } from "./ServiceCard";
import { getProfile } from "@/lib/profile";

// Layout only: which card is wide. Content comes from the profile.
const WIDTHS = ["lg:col-span-2", "lg:col-span-1", "lg:col-span-1", "lg:col-span-2"];

export default async function ServicesSection() {
  const t = await getTranslations("services");
  const profile = getProfile(await getLocale());

  return (
    <section className="container mx-auto">
      <Reveal as="h2" className="text-4xl font-bold text-center mb-16">
        {t("title")}
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {profile.services.map((service, index) => (
          <Reveal key={service.id} delayMs={index * 200}>
            <ServiceCard
              serviceKey={service.id as ServiceKey}
              id={String(index + 1).padStart(2, "0")}
              title={service.title}
              description={service.description}
              className={WIDTHS[index] ?? "lg:col-span-1"}
            />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
