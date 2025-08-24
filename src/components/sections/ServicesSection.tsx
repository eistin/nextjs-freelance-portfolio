"use client";

import { useTranslations } from "next-intl";
import { ChevronRight, Code2, Rocket, Container, Cloud } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { useService } from "@/contexts/ServiceContext";

export default function ServicesSection() {
  const t = useTranslations("services");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { selectServiceAndScroll } = useService();

  const services = [
    {
      id: "01",
      key: "infrastructure",
      icon: Code2,
      width: "lg:col-span-2", // 65% width
    },
    {
      id: "02",
      key: "cicd",
      icon: Rocket,
      width: "lg:col-span-1", // 35% width
    },
    {
      id: "03",
      key: "kubernetes",
      icon: Container,
      width: "lg:col-span-1", // 35% width
    },
    {
      id: "04",
      key: "cloud",
      icon: Cloud,
      width: "lg:col-span-2", // 65% width
    },
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
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

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <motion.div
              key={service.id}
              className={service.width}
              variants={itemVariants}
            >
              <Card
                className={`group h-full hover:shadow-lg transition-all duration-500 cursor-pointer overflow-hidden relative bg-card border border-border hover:border-primary/50`}
                onClick={() => selectServiceAndScroll(service.key as "infrastructure" | "cicd" | "kubernetes" | "cloud")}
              >
                {/* Subtle pattern background */}
                <div className="absolute inset-0 opacity-[0.015]">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1px)`,
                      backgroundSize: "24px 24px",
                    }}
                  />
                </div>

                <CardHeader className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <motion.div
                        className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <Icon className="w-6 h-6 text-primary" />
                      </motion.div>
                      <span className="text-2xl font-bold text-primary">
                        {service.id}
                      </span>
                    </div>
                    <motion.div
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      animate={{ x: 0 }}
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <ChevronRight className="text-primary" />
                    </motion.div>
                  </div>
                </CardHeader>

                <CardContent className="relative z-10">
                  <CardTitle className="text-2xl mb-4 group-hover:text-primary transition-colors">
                    {t(`items.${service.key}.title`)}
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {t(`items.${service.key}.description`)}
                  </CardDescription>

                  {/* Subtle accent line */}
                  <motion.div
                    className="absolute left-0 top-0 w-1 bg-primary rounded-r-full"
                    initial={{ height: "0%" }}
                    whileHover={{ height: "100%" }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
