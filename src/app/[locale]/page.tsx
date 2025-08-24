import Header from "@/components/Header";
import HeroSection from "@/components/sections/HeroSection";
import ServicesSection from "@/components/sections/ServicesSection";
import RecentWorkSection from "@/components/sections/RecentWorkSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import AboutSection from "@/components/sections/AboutSection";
import ContactSection from "@/components/sections/ContactSection";
import { getAllProjects } from "@/lib/projects";
import { getAllTestimonials } from "@/lib/testimonials";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const projects = await getAllProjects(locale);
  const testimonials = await getAllTestimonials(locale);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        {/* Hero Section - Special padding for first section */}
        <div id="home" className="pt-24 pb-20 px-6">
          <HeroSection />
        </div>

        {/* Services Section - With background */}
        <div id="services" className="py-20 px-6 bg-muted/30">
          <ServicesSection />
        </div>

        {/* Recent Work Section */}
        <div id="projects" className="py-20 px-6">
          <RecentWorkSection projects={projects} />
        </div>

        {/* Testimonials Section - With background */}
        <div className="py-20 px-6 bg-muted/30">
          <TestimonialsSection testimonials={testimonials} />
        </div>

        {/* About Section - With background */}
        <div id="about" className="py-20 px-6 bg-muted/30">
          <AboutSection />
        </div>

        {/* Contact Section */}
        <div id="contact" className="py-20 px-6">
          <ContactSection />
        </div>
      </main>
    </div>
  );
}
