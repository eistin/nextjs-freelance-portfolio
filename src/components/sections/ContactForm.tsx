"use client";

import { useTranslations, useLocale } from "next-intl";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useEffect, useState, useTransition } from "react";
import { useService } from "@/contexts/ServiceContext";
import { Badge } from "@/components/ui/badge";
import { submitContactForm, type ActionResult } from "@/lib/actions";
import { useAnalytics } from "@/lib/analytics";

export function ContactForm() {
  const t = useTranslations("contact");
  const tServices = useTranslations("services");
  const locale = useLocale();
  const { selectedService, setSelectedService } = useService();
  const [subject, setSubject] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { trackFormEvent } = useAnalytics();

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
    trackFormEvent('submit', 'contact');

    startTransition(async () => {
      setResult(null);
      setErrors({});

      const result = await submitContactForm(formData, locale);
      setResult(result);

      if (result.errors) {
        setErrors(result.errors);
        trackFormEvent('error', 'contact');
      } else if (result.success) {
        // Reset form on success
        const form = document.getElementById('contact-form') as HTMLFormElement;
        form?.reset();
        setSubject("");
        setSelectedService(null);
      }
    });
  };

  return (
    <Card className="border-2 hover:border-primary/30 transition-colors h-full">
      <CardContent className="p-8 h-full flex flex-col justify-between">
        {/* Selected Service Indicator */}
        {selectedService && (
          <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
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
          </div>
        )}

        <form id="contact-form" action={handleSubmit} className="space-y-6 flex-1 flex flex-col">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 transition-transform hover:scale-[1.01]">
              <Label htmlFor="fullName">{t("form.fullName.label")}</Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder={t("form.fullName.placeholder")}
                className={`hover:border-primary/50 focus:border-primary transition-colors ${
                  errors.fullName ? "border-red-500" : ""
                }`}
                aria-invalid={errors.fullName ? "true" : "false"}
                aria-describedby={errors.fullName ? "fullName-error" : undefined}
                required
              />
              {errors.fullName && (
                <p id="fullName-error" className="text-sm text-red-500 mt-1" role="alert">{errors.fullName}</p>
              )}
            </div>
            <div className="space-y-2 transition-transform hover:scale-[1.01]">
              <Label htmlFor="email">{t("form.email.label")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t("form.email.placeholder")}
                className={`hover:border-primary/50 focus:border-primary transition-colors ${
                  errors.email ? "border-red-500" : ""
                }`}
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? "email-error" : undefined}
                required
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-red-500 mt-1" role="alert">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="space-y-2 transition-transform hover:scale-[1.01]">
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
              aria-invalid={errors.subject ? "true" : "false"}
              aria-describedby={errors.subject ? "subject-error" : undefined}
              required
            />
            {errors.subject && (
              <p id="subject-error" className="text-sm text-red-500 mt-1" role="alert">{errors.subject}</p>
            )}
          </div>

          <div className="space-y-2 flex-1 flex flex-col transition-transform hover:scale-[1.01]">
            <Label htmlFor="message">{t("form.message.label")}</Label>
            <Textarea
              id="message"
              name="message"
              placeholder={t("form.message.placeholder")}
              className={`hover:border-primary/50 focus:border-primary transition-colors resize-none flex-1 ${
                errors.message ? "border-red-500" : ""
              }`}
              aria-invalid={errors.message ? "true" : "false"}
              aria-describedby={errors.message ? "message-error" : undefined}
              required
            />
            {errors.message && (
              <p id="message-error" className="text-sm text-red-500 mt-1" role="alert">{errors.message}</p>
            )}
          </div>

          <div className="pt-4">
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
              <div
                className={`p-4 rounded-lg border mt-4 ${
                  result.success
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                <p className="text-sm font-medium">
                  {result.success ? t("form.success") : t("form.error")}
                </p>
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
