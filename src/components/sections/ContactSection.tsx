"use client";

import { useTranslations, useLocale } from "next-intl";
import {
  Linkedin,
  Github,
  Send,
  MapPin,
  Mail as MailIcon,
  Phone,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useEffect, useState, useTransition } from "react";
import { useService } from "@/contexts/ServiceContext";
import { Badge } from "@/components/ui/badge";
import { submitContactForm, type ActionResult } from "@/lib/actions";

export default function ContactSection() {
  const t = useTranslations("contact");
  const tServices = useTranslations("services");
  const locale = useLocale();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { selectedService, setSelectedService } = useService();
  const [subject, setSubject] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update subject when service is selected
  useEffect(() => {
    if (selectedService) {
      const serviceTitle = tServices(`items.${selectedService}.title`);
      setSubject(`${t("inquiryAbout")} ${serviceTitle}`);
    }
  }, [selectedService, tServices, t]);

  const clearSelectedService = () => {
    setSelectedService(null);
    setSubject("");
  };

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      setResult(null);
      setErrors({});
      
      const result = await submitContactForm(formData, locale);
      setResult(result);
      
      if (result.errors) {
        setErrors(result.errors);
      } else if (result.success) {
        // Reset form on success
        const form = document.getElementById('contact-form') as HTMLFormElement;
        form?.reset();
        setSubject("");
        setSelectedService(null);
      }
    });
  };

  const socialLinks = [
    { icon: Linkedin, href: "https://www.linkedin.com/in/edwin-istin/", labelKey: "linkedin" },
    { icon: Github, href: "https://github.com/eistin", labelKey: "github" },
  ];

  const contactInfo = [
    { icon: MailIcon, textKey: "email", href: "mailto:hello@turjo.dev" },
    { icon: Phone, textKey: "phone", href: "tel:+33612345678" },
    { icon: MapPin, textKey: "location", href: "#" },
  ];

  const formVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: [0.21, 0.47, 0.32, 0.98],
      },
    },
  };

  const leftVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: [0.21, 0.47, 0.32, 0.98],
      },
    },
  };

  return (
    <section className="container mx-auto" ref={ref}>
      <motion.h2
        className="text-4xl font-bold text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
      >
        {t("title")}
      </motion.h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Left side - Contact Info */}
        <motion.div
          className="space-y-8"
          variants={leftVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {/* Profile section */}
          <div className="text-center lg:text-left">
            <motion.div
              className="inline-block relative mb-6"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20">
                <Image
                  src="/photo.svg"
                  alt="Profile"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </div>
              <motion.div
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>

            <motion.p
              className="text-muted-foreground mb-4"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.2 }}
            >
              {t("ready")}
            </motion.p>

            <motion.h3
              className="text-3xl font-bold mb-4 leading-tight"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.3 }}
            >
              {t("heading")}
            </motion.h3>

            <motion.p
              className="text-muted-foreground mb-8"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.4 }}
            >
              {t("description")}
            </motion.p>
          </div>

          {/* Contact Information */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.5 }}
          >
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <motion.a
                  key={index}
                  href={info.href}
                  className="flex items-center space-x-4 text-muted-foreground hover:text-primary transition-colors group"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span>{t(`info.${info.textKey}`)}</span>
                </motion.a>
              );
            })}
          </motion.div>

          {/* Social Links */}
          <motion.div
            className="flex space-x-2"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.6 }}
          >
            {socialLinks.map((social, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Button
                  variant="outline"
                  size="icon"
                  asChild
                  className="hover:border-primary/50 hover:bg-primary/10"
                >
                  <Link href={social.href} aria-label={t(`social.${social.labelKey}`)}>
                    <social.icon className="h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right side - Contact Form */}
        <motion.div
          variants={formVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="h-full"
        >
          <Card className="border-2 hover:border-primary/30 transition-colors h-full">
            <CardContent className="p-8 h-full flex flex-col justify-between">
              {/* Selected Service Indicator */}
              {selectedService && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="default" className="bg-primary text-primary-foreground">
                        {t("selectedService")}
                      </Badge>
                      <span className="font-semibold text-primary">
                        {tServices(`items.${selectedService}.title`)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSelectedService}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </Button>
                  </div>
                </motion.div>
              )}

              <form id="contact-form" action={handleSubmit} className="space-y-6 flex-1 flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div
                    className="space-y-2"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Label htmlFor="fullName">{t("form.fullName.label")}</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder={t("form.fullName.placeholder")}
                      className={`hover:border-primary/50 focus:border-primary transition-colors ${
                        errors.fullName ? "border-red-500" : ""
                      }`}
                      required
                    />
                    {errors.fullName && (
                      <p className="text-sm text-red-500 mt-1">{errors.fullName}</p>
                    )}
                  </motion.div>
                  <motion.div
                    className="space-y-2"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Label htmlFor="email">{t("form.email.label")}</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder={t("form.email.placeholder")}
                      className={`hover:border-primary/50 focus:border-primary transition-colors ${
                        errors.email ? "border-red-500" : ""
                      }`}
                      required
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                    )}
                  </motion.div>
                </div>

                <motion.div
                  className="space-y-2"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Label htmlFor="subject">{t("form.subject.label")}</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={t("form.subject.placeholder")}
                    className={`hover:border-primary/50 focus:border-primary transition-colors ${
                      errors.subject ? "border-red-500" : ""
                    }`}
                    required
                  />
                  {errors.subject && (
                    <p className="text-sm text-red-500 mt-1">{errors.subject}</p>
                  )}
                </motion.div>

                <motion.div
                  className="space-y-2 flex-1 flex flex-col"
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Label htmlFor="message">{t("form.message.label")}</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder={t("form.message.placeholder")}
                    className={`hover:border-primary/50 focus:border-primary transition-colors resize-none flex-1 ${
                      errors.message ? "border-red-500" : ""
                    }`}
                    required
                  />
                  {errors.message && (
                    <p className="text-sm text-red-500 mt-1">{errors.message}</p>
                  )}
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className="pt-4"
                >
                  <Button type="submit" disabled={isPending} className="w-full cursor-pointer" size="lg">
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("form.sending")}
                      </>
                    ) : (
                      <>
                        {t("form.submit")}
                        <Send className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  
                  {/* Success/Error Messages */}
                  {result && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-lg border mt-4 ${
                        result.success
                          ? "bg-green-50 border-green-200 text-green-700"
                          : "bg-red-50 border-red-200 text-red-700"
                      }`}
                    >
                      <p className="text-sm font-medium">
                        {result.success ? t("form.success") : t("form.error")}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
