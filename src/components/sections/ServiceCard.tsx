"use client";

import { ChevronRight, Code2, Rocket, Container, Cloud, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useService } from "@/contexts/ServiceContext";

type ServiceKey = "infrastructure" | "cicd" | "kubernetes" | "cloud";

const ICONS: Record<ServiceKey, LucideIcon> = {
  infrastructure: Code2,
  cicd: Rocket,
  kubernetes: Container,
  cloud: Cloud,
};

type ServiceCardProps = {
  serviceKey: ServiceKey;
  id: string;
  title: string;
  description: string;
  className?: string;
};

export function ServiceCard({ serviceKey, id, title, description, className }: ServiceCardProps) {
  const { selectServiceAndScroll } = useService();
  const Icon = ICONS[serviceKey];

  return (
    <div className={className}>
      <Card
        className="group h-full hover:shadow-lg transition-all duration-500 cursor-pointer overflow-hidden relative bg-card border border-border hover:border-primary/50"
        onClick={() => selectServiceAndScroll(serviceKey)}
      >
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
              <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-all group-hover:scale-105">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <span className="text-2xl font-bold text-primary">{id}</span>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
              <ChevronRight className="text-primary" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <CardTitle className="text-2xl mb-4 group-hover:text-primary transition-colors">{title}</CardTitle>
          <CardDescription className="text-base leading-relaxed">{description}</CardDescription>
          <div className="absolute left-0 top-0 w-1 h-0 group-hover:h-full bg-primary rounded-r-full transition-[height] duration-500 ease-out" />
        </CardContent>
      </Card>
    </div>
  );
}
