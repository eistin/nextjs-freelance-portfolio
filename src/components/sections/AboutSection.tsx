"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Award, Briefcase, Users, ArrowUpRight } from "lucide-react";

export default function AboutSection() {
  const t = useTranslations("about");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const stats = [
    {
      key: "experience",
      number: t("stats.experience.number"),
      label: t("stats.experience.label"),
      icon: Award,
      delay: 0,
    },
    {
      key: "projects",
      number: t("stats.projects.number"),
      label: t("stats.projects.label"),
      icon: Briefcase,
      delay: 0.1,
    },
    {
      key: "satisfaction",
      number: t("stats.satisfaction.number"),
      label: t("stats.satisfaction.label"),
      icon: Users,
      delay: 0.2,
    },
  ];

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
        className="text-4xl font-bold text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
      >
        {t("title")}
      </motion.h2>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-start">
        {/* Left side - Image and visual elements */}
        <motion.div
          className="lg:col-span-2 relative"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Decorative background element */}
          <div className="absolute inset-0 -z-10 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1px)`,
                backgroundSize: "32px 32px",
              }}
            />
          </div>
          
          {/* Main profile image */}
          <motion.div
            className="relative aspect-square max-w-sm mx-auto lg:mx-0"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {/* Gradient background for depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 rounded-2xl -z-10" />
            
            {/* Image container with modern styling */}
            <div className="relative overflow-hidden rounded-2xl">
              <Image
                src="/photo.svg"
                alt="Profile"
                width={400}
                height={400}
                className="w-full h-full object-cover"
              />
              
              {/* Subtle overlay on hover */}
              <motion.div
                className="absolute inset-0 bg-primary/5"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Right side - Content */}
        <motion.div
          className="lg:col-span-3"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <motion.div
            className="mb-12"
            variants={itemVariants}
          >
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t("description")}
            </p>
          </motion.div>

          {/* Stats grid with improved design */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            variants={containerVariants}
          >
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.key}
                  variants={itemVariants}
                  className="group"
                >
                  <Card className="relative h-full hover:shadow-lg transition-all duration-500 border border-border hover:border-primary/50 overflow-hidden">
                    {/* Subtle pattern background */}
                    <div className="absolute inset-0 opacity-[0.015]">
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1px)`,
                          backgroundSize: "20px 20px",
                        }}
                      />
                    </div>

                    <CardContent className="relative z-10 p-6 text-center">
                      {/* Icon with improved styling */}
                      <motion.div
                        className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors"
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <Icon className="w-7 h-7 text-primary" />
                      </motion.div>
                      
                      {/* Number with enhanced animation */}
                      <motion.h3
                        className="text-3xl lg:text-4xl font-bold text-primary mb-2"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                        transition={{
                          delay: 0.5 + stat.delay,
                          type: "spring",
                          stiffness: 200,
                          damping: 15,
                        }}
                      >
                        {stat.number}
                      </motion.h3>
                      
                      <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                        {stat.label}
                      </p>

                      {/* Hover indicator */}
                      <motion.div
                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                        initial={{ scale: 0 }}
                        whileHover={{ scale: 1 }}
                      >
                        <ArrowUpRight className="w-4 h-4 text-primary" />
                      </motion.div>

                      {/* Accent line */}
                      <motion.div
                        className="absolute left-0 top-0 w-1 bg-primary rounded-r-full"
                        initial={{ height: "0%" }}
                        animate={isInView ? { height: "100%" } : { height: "0%" }}
                        transition={{ 
                          delay: 0.7 + stat.delay, 
                          duration: 0.8, 
                          ease: "easeOut" 
                        }}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
