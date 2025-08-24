import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import localFont from "next/font/local";
import "@/app/globals.css";
import { ServiceProvider } from "@/contexts/ServiceContext";
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

export const metadata: Metadata = {
  title: "Edwin Istin - DevOps & SRE Engineer",
  description: "Expert DevOps & SRE Engineer specializing in Infrastructure as Code, CI/CD, Kubernetes, and Cloud Architecture",
  icons: {
    icon: "/cloud-icon.png",
    shortcut: "/cloud-icon.png",
    apple: "/cloud-icon.png",
  },
};

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
