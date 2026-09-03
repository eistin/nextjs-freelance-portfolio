"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/Reveal";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowUpRight,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Project } from "@/lib/projects";

interface RecentWorkPageProps {
  projects: Project[];
}

export default function RecentWorkPage({ projects }: RecentWorkPageProps) {
  const t = useTranslations("recentWork");
  const params = useParams();
  const locale = params.locale as string;

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Header */}
      <Reveal className="mb-12">
        <Link href={`/${locale}`} className="cursor-pointer">
          <Button variant="ghost" className="gap-2 mb-6 pl-0 cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            {t("backToHome")}
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-4">
          {t("allProjects")}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          {t("pageDescription")}
        </p>
      </Reveal>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project, index) => (
          <Reveal key={project.slug} delayMs={index * 100}>
            <Link href={`/${locale}/projects/${project.slug}`}>
              <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <Badge variant="secondary" className="mb-3">
                        {project.metadata.category}
                      </Badge>
                      <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                        {project.metadata.title}
                      </h3>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>

                  <p className="text-muted-foreground mb-4 text-sm line-clamp-3">
                    {project.metadata.challenge}
                  </p>

                  {/* Tech Stack */}
                  <div className="flex flex-wrap gap-2">
                    {project.metadata.technologies.map((tech) => (
                      <Badge key={tech} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </Reveal>
        ))}
      </div>

      {/* Call to Action */}
      <Reveal
        className="text-center mt-16 p-8 bg-muted/30 rounded-lg"
        delayMs={500}
      >
        <h2 className="text-2xl font-bold mb-4">
          {t("ctaTitle")}
        </h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          {t("ctaDescription")}
        </p>
        <Link href={`/${locale}#contact`} className="cursor-pointer">
          <Button size="lg" className="gap-2 cursor-pointer">
            {t("cta")}
            <ArrowUpRight className="w-4 h-4" />
          </Button>
        </Link>
      </Reveal>
    </div>
  );
}