import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Project } from "@/lib/projects";
import { Reveal } from "@/components/ui/Reveal";

interface RecentWorkSectionProps {
  projects: Project[];
  locale: string;
}

export default async function RecentWorkSection({ projects, locale }: RecentWorkSectionProps) {
  const t = await getTranslations("recentWork");
  const displayProjects = projects.slice(0, 3); // Show only first 3

  return (
    <section className="container mx-auto">
      <Reveal as="h2" className="text-3xl font-bold text-center mb-8">
        {t("title")}
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayProjects.map((project, index) => (
          <Reveal key={project.slug} delayMs={index * 150}>
            <Link href={`/${locale}/projects/${project.slug}`}>
              <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 h-full">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <Badge variant="secondary" className="mb-2 text-xs">
                        {project.metadata.category}
                      </Badge>
                      <h3 className="text-base font-bold mb-2 group-hover:text-primary transition-colors">
                        {project.metadata.title}
                      </h3>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>

                  <p className="text-muted-foreground mb-3 text-sm line-clamp-2">
                    {project.metadata.challenge}
                  </p>

                  {/* Tech Stack */}
                  <div className="flex flex-wrap gap-1">
                    {project.metadata.technologies.slice(0, 3).map((tech) => (
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

      {/* See More Button */}
      <Reveal className="text-center mt-8" delayMs={300}>
        <Link href={`/${locale}/recent-work`} className="cursor-pointer">
          <Button variant="outline" size="lg" className="gap-2 cursor-pointer">
            {t("seeMore")}
            <ArrowUpRight className="w-4 h-4" />
          </Button>
        </Link>
      </Reveal>
    </section>
  );
}
