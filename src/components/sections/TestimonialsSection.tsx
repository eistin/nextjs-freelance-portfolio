"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Star } from "lucide-react";
import { type Testimonial } from "@/lib/testimonials";

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

export default function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  const t = useTranslations("testimonials");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="container mx-auto overflow-hidden" ref={ref}>
      <motion.h2
        className="text-3xl font-bold text-center mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
      >
        {t("title")}
      </motion.h2>

      {/* Desktop Infinite Scroll */}
      <div className="hidden lg:block overflow-hidden w-full relative carousel-container">
        <div 
          className="flex gap-6 will-change-transform"
          style={{
            animation: 'scroll 30s linear infinite',
            width: 'fit-content'
          }}
        >
          {/* Double the testimonials for seamless loop */}
          {[...testimonials, ...testimonials].map((testimonial, index) => (
            <Dialog key={`${testimonial.slug}-${index}`}>
              <DialogTrigger asChild>
                <Card className="flex-shrink-0 w-80 h-64 hover:shadow-md transition-all duration-300 hover:border-primary/30 cursor-pointer">
                  <CardContent className="p-5 h-full flex flex-col">
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
                    <blockquote className="text-sm mb-4 text-muted-foreground flex-grow overflow-hidden">
                      <div className="line-clamp-4">
                        &ldquo;{testimonial.content}&rdquo;
                      </div>
                    </blockquote>

                    {/* Author Info */}
                    <div className="flex items-center gap-3 mt-auto">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={testimonial.metadata.avatar} alt={testimonial.metadata.name} />
                        <AvatarFallback className="text-sm bg-primary/10 text-primary">
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
                      <h3 className="font-semibold text-lg">
                        {testimonial.metadata.name}
                      </h3>
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
                  <blockquote className="text-base text-muted-foreground leading-relaxed">
                    &ldquo;{testimonial.content}&rdquo;
                  </blockquote>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </div>

      {/* Mobile Infinite Scroll */}
      <div className="lg:hidden overflow-hidden w-full relative carousel-container">
        <div 
          className="flex gap-4 will-change-transform"
          style={{
            animation: 'scroll-mobile 25s linear infinite',
            width: 'fit-content'
          }}
        >
          {/* Double the testimonials for seamless loop */}
          {[...testimonials, ...testimonials].map((testimonial, index) => (
            <Dialog key={`${testimonial.slug}-mobile-${index}`}>
              <DialogTrigger asChild>
                <Card className="flex-shrink-0 w-64 sm:w-72 h-60 hover:shadow-md transition-all duration-300 hover:border-primary/30 cursor-pointer">
                  <CardContent className="p-4 h-full flex flex-col">
                    {/* Rating Stars */}
                    <div className="flex gap-1 mb-3">
                      {[...Array(testimonial.metadata.rating || 5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-primary text-primary"
                        />
                      ))}
                    </div>
                    
                    {/* Testimonial Text */}
                    <blockquote className="text-sm mb-3 text-muted-foreground flex-grow overflow-hidden">
                      <div className="line-clamp-3">
                        &ldquo;{testimonial.content}&rdquo;
                      </div>
                    </blockquote>
                    
                    {/* Author Info */}
                    <div className="flex items-center gap-3 mt-auto">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={testimonial.metadata.avatar} alt={testimonial.metadata.name} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
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
                      <h3 className="font-semibold text-lg">
                        {testimonial.metadata.name}
                      </h3>
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
                  <blockquote className="text-base text-muted-foreground leading-relaxed">
                    &ldquo;{testimonial.content}&rdquo;
                  </blockquote>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </div>
    </section>
  );
}