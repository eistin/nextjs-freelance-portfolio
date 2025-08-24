"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Project } from "@/lib/projects";

interface RecentWorkSectionProps {
  projects: Project[];
}

export default function RecentWorkSection({ projects }: RecentWorkSectionProps) {
  const t = useTranslations("recentWork");
  const params = useParams();
  const locale = params.locale as string;
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const displayProjects = projects.slice(0, 3); // Show only first 3

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.21, 0.47, 0.32, 0.98],
      },
    },
  };

  return (
    <section className="container mx-auto" ref={ref}>
      <motion.h2
        className="text-3xl font-bold text-center mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
      >
        {t("title")}
      </motion.h2>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        {displayProjects.map((project) => (
          <motion.div key={project.slug} variants={itemVariants}>
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
          </motion.div>
        ))}
      </motion.div>

      {/* See More Button */}
      <motion.div
        className="text-center mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Link href={`/${locale}/recent-work`} className="cursor-pointer">
          <Button variant="outline" size="lg" className="gap-2 cursor-pointer">
            {t("seeMore")}
            <ArrowUpRight className="w-4 h-4" />
          </Button>
        </Link>
      </motion.div>
    </section>
  );
}
