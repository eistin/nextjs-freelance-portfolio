import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/ui/Reveal";
import { TestimonialCard } from "./TestimonialCard";
import { type Testimonial } from "@/lib/testimonials";

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

export default async function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  const t = await getTranslations("testimonials");

  return (
    <section className="container mx-auto overflow-hidden">
      <Reveal as="h2" className="text-3xl font-bold text-center mb-8">
        {t("title")}
      </Reveal>

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
            <TestimonialCard
              key={`${testimonial.slug}-${index}`}
              testimonial={testimonial}
              variant="desktop"
            />
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
            <TestimonialCard
              key={`${testimonial.slug}-mobile-${index}`}
              testimonial={testimonial}
              variant="mobile"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
