"use client";

import { useTranslations } from "next-intl";
import {
  Linkedin,
  Github,
  Download,
  MapPin,
  Mail as MailIcon,
  Phone,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/lib/analytics";

export function ContactInfo() {
  const t = useTranslations("contact");
  const { trackButtonClick } = useAnalytics();

  const handleSocialClick = (labelKey: string, href: string) => {
    trackButtonClick(labelKey, href);
  };

  const socialLinks = [
    { icon: Linkedin, href: "https://www.linkedin.com/in/edwin-istin/", labelKey: "linkedin" },
    { icon: Github, href: "https://github.com/eistin", labelKey: "github" },
    { icon: Download, href: "/CV_DEVOPS_2026.pdf", labelKey: "downloadCv", download: "CV_DEVOPS_EDWIN_ISTIN_2026.pdf" },
  ];

  const contactInfo = [
    { icon: MailIcon, textKey: "email", href: "mailto:hello@turjo.dev" },
    { icon: Phone, textKey: "phone", href: "tel:+33612345678" },
    { icon: MapPin, textKey: "location", href: "#" },
  ];

  return (
    <div className="space-y-8">
      {/* Profile section */}
      <div className="text-center lg:text-left">
        <div className="inline-block relative mb-6 transition-transform hover:scale-105">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20">
            <Image
              src="/photo.webp"
              alt="Edwin Istin, DevOps and SRE Engineer"
              width={128}
              height={128}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full animate-pulse" />
        </div>

        <p className="text-muted-foreground mb-4">
          {t("ready")}
        </p>

        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 leading-tight sm:leading-tight">
          {t("heading")}
        </h3>

        <p className="text-muted-foreground mb-8">
          {t("description")}
        </p>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        {contactInfo.map((info, index) => {
          const Icon = info.icon;
          return (
            <a
              key={index}
              href={info.href}
              className="flex items-center space-x-4 text-muted-foreground hover:text-primary transition-colors group transition-transform hover:translate-x-1"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <span>{t(`info.${info.textKey}`)}</span>
            </a>
          );
        })}
      </div>

      {/* Social Links */}
      <div className="flex space-x-2">
        {socialLinks.map((social, index) => (
          <div key={index} className="transition-transform hover:-translate-y-1">
            {social.labelKey === 'downloadCv' ? (
              <Button
                variant="outline"
                asChild
                className="hover:border-primary/50 hover:bg-primary/10"
              >
                <Link
                  href={social.href}
                  aria-label={t(`social.${social.labelKey}`)}
                  onClick={() => handleSocialClick(social.labelKey, social.href)}
                  {...(social.download && { download: social.download })}
                  className="flex items-center gap-2"
                >
                  <social.icon className="h-5 w-5" />
                  <span>{t(`social.${social.labelKey}`)}</span>
                </Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="icon"
                asChild
                className="hover:border-primary/50 hover:bg-primary/10"
              >
                <Link
                  href={social.href}
                  aria-label={t(`social.${social.labelKey}`)}
                  onClick={() => handleSocialClick(social.labelKey, social.href)}
                >
                  <social.icon className="h-5 w-5" />
                </Link>
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
