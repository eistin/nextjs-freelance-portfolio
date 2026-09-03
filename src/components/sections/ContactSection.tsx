import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/ui/Reveal";
import { ContactInfo } from "./ContactInfo";
import { ContactForm } from "./ContactForm";

export default async function ContactSection() {
  const t = await getTranslations("contact");
  return (
    <section className="container mx-auto">
      <Reveal as="h2" className="text-4xl font-bold text-center mb-16">
        {t("title")}
      </Reveal>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <ContactInfo />
        <ContactForm />
      </div>
    </section>
  );
}
