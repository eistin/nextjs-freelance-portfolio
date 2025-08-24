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
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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
    <div className="container mx-auto px-4 py-16" ref={ref}>
      {/* Header */}
      <motion.div
        className="mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
      >
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
      </motion.div>

      {/* Projects Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        {projects.map((project) => (
          <motion.div key={project.slug} variants={itemVariants}>
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
          </motion.div>
        ))}
      </motion.div>

      {/* Call to Action */}
      <motion.div
        className="text-center mt-16 p-8 bg-muted/30 rounded-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 0.5 }}
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
      </motion.div>
    </div>
  );
}