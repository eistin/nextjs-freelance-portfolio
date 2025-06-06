import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

interface MetadataProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: MetadataProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("title"),
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default function HomePage() {
  const t = useTranslations("HomePage");
  return (
    <div>
      <h1>{t("title")}</h1>
      <Link href="/about">{t("about")}</Link>
    </div>
  );
}

// IF ASYNC
// import { getTranslations } from "next-intl/server";

// export default async function HomePage() {
//   const t = await getTranslations("HomePage");
//   return <h1>{t("title")}</h1>;
// }
