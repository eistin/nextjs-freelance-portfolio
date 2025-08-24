import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import localFont from "next/font/local";
import "@/app/globals.css";
import { ServiceProvider } from "@/contexts/ServiceContext";
import { StructuredData } from "@/components/StructuredData";
import { Metadata } from "next";

const archivGrotesk = localFont({
  src: [
    {
      path: "./fonts/ArchivGrotesk-Hairline2.otf",
      weight: "100",
      style: "normal",
    },
    {
      path: "./fonts/ArchivGrotesk-Light2.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/ArchivGrotesk-Regular2.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/ArchivGrotesk-Normal2.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/ArchivGrotesk-SemiBold2.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/ArchivGrotesk-Bold2.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-archiv-grotesk",
  display: "swap",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://edwindev.cloud";
  const currentUrl = `${baseUrl}/${locale}`;

  return {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
    authors: [{ name: t("author") }],
    creator: t("author"),
    publisher: t("author"),
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: "/cloud-icon.png",
      shortcut: "/cloud-icon.png",
      apple: "/cloud-icon.png",
    },
    manifest: "/site.webmanifest",
    openGraph: {
      type: "website",
      locale: locale,
      url: currentUrl,
      title: t("ogTitle"),
      description: t("ogDescription"),
      siteName: "Edwin Istin Portfolio",
      images: [
        {
          url: t("ogImage"),
          width: 1200,
          height: 630,
          alt: t("ogTitle"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("twitterTitle"),
      description: t("twitterDescription"),
      images: [t("ogImage")],
      creator: "@Stini46111608",
    },
    alternates: {
      canonical: currentUrl,
      languages: {
        "en": `${baseUrl}/en`,
        "fr": `${baseUrl}/fr`,
        "x-default": `${baseUrl}/en`,
      },
    },
    verification: {
      google: "eAXhj6LexxkmYYyLkQ2SPAc9vE6S9siJ147TJhSWEs8",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Ensure that the incoming `locale` is valid
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale}>
      <head>
        <StructuredData locale={locale} />
      </head>
      <body className={`${archivGrotesk.variable} font-sans`}>
        <NextIntlClientProvider>
          <ServiceProvider>
            {children}
          </ServiceProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
