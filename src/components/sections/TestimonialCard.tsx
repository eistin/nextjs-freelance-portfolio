"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Linkedin, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { type Testimonial } from "@/lib/testimonials";

interface TestimonialCardProps {
  testimonial: Testimonial;
  variant: "desktop" | "mobile";
}

export function TestimonialCard({ testimonial, variant }: TestimonialCardProps) {
  const t = useTranslations("testimonials");
  const isDesktop = variant === "desktop";

  const cardSize = isDesktop
    ? "w-80 h-64"
    : "w-64 sm:w-72 h-60";
  const contentPad = isDesktop ? "p-5" : "p-4";
  const quoteMargin = isDesktop ? "mb-4" : "mb-3";
  const quoteClamp = isDesktop ? "line-clamp-4" : "line-clamp-3";
  const avatarSize = isDesktop ? "w-10 h-10" : "w-9 h-9";
  const avatarFallbackText = isDesktop ? "text-sm bg-primary/10 text-primary" : "text-xs bg-primary/10 text-primary";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card
          className={`flex-shrink-0 ${cardSize} hover:shadow-md transition-all duration-300 hover:border-primary/30 cursor-pointer`}
        >
          <CardContent className={`${contentPad} h-full flex flex-col`}>
            {/* Rating Stars */}
            <div className="flex gap-1 mb-3">
              {[...Array(testimonial.metadata.rating || 5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4 fill-primary text-primary"
                />
              ))}
            </div>

            {/* Testimonial Content */}
            <blockquote className={`text-sm ${quoteMargin} text-muted-foreground flex-grow overflow-hidden`}>
              <div className={quoteClamp}>
                &ldquo;{testimonial.content.trim()}&rdquo;
              </div>
            </blockquote>

            {/* Author Info */}
            <div className="flex items-center gap-3 mt-auto">
              <Avatar className={avatarSize}>
                <AvatarImage src={testimonial.metadata.avatar} alt={testimonial.metadata.name} />
                <AvatarFallback className={avatarFallbackText}>
                  {testimonial.metadata.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">
                  {testimonial.metadata.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {testimonial.metadata.role}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3 mb-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={testimonial.metadata.avatar} alt={testimonial.metadata.name} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {testimonial.metadata.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">
                  {testimonial.metadata.name}
                </h3>
                {testimonial.metadata.linkedin && (
                  <a
                    href={testimonial.metadata.linkedin}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    aria-label={t("viewLinkedIn", { name: testimonial.metadata.name })}
                    title={t("viewLinkedIn", { name: testimonial.metadata.name })}
                    className="text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {testimonial.metadata.role} • {testimonial.metadata.company}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 -mx-2 px-2">
          {/* Rating Stars */}
          <div className="flex gap-1 mb-4">
            {[...Array(testimonial.metadata.rating || 5)].map((_, i) => (
              <Star
                key={i}
                className="w-5 h-5 fill-primary text-primary"
              />
            ))}
          </div>

          {/* Full Testimonial Content */}
          {/* pre-line: some testimonials are multi-paragraph with bullet lists,
              and the raw markdown body is rendered as text, not parsed. */}
          <blockquote className="text-base text-muted-foreground leading-relaxed whitespace-pre-line">
            &ldquo;{testimonial.content.trim()}&rdquo;
          </blockquote>
        </div>
      </DialogContent>
    </Dialog>
  );
}
