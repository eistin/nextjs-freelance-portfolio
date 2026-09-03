import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/ui/Reveal";
import { ServiceCard, type ServiceKey } from "./ServiceCard";

export default async function ServicesSection() {
  const t = await getTranslations("services");

  const services = [
    {
      id: "01",
      key: "infrastructure",
      width: "lg:col-span-2", // 65% width
    },
    {
      id: "02",
      key: "cicd",
      width: "lg:col-span-1", // 35% width
    },
    {
      id: "03",
      key: "kubernetes",
      width: "lg:col-span-1", // 35% width
    },
    {
      id: "04",
      key: "cloud",
      width: "lg:col-span-2", // 65% width
    },
  ];

  return (
    <section className="container mx-auto">
      <Reveal as="h2" className="text-4xl font-bold text-center mb-16">
        {t("title")}
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {services.map((service, index) => (
          <Reveal key={service.id} delayMs={index * 200}>
            <ServiceCard
              serviceKey={service.key as ServiceKey}
              id={service.id}
              title={t(`items.${service.key}.title`)}
              description={t(`items.${service.key}.description`)}
              className={service.width}
            />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
