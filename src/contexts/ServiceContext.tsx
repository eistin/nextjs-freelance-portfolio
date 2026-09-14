"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type ServiceType = "infrastructure" | "cicd" | "kubernetes" | "cloud" | null;

interface ServiceContextType {
  selectedService: ServiceType;
  // The service's display title, supplied by the caller (ServiceCard) since
  // titles now come from the profile artifact, not messages/ — the context
  // has no translation access of its own.
  selectedServiceTitle: string | null;
  setSelectedService: (service: ServiceType) => void;
  selectServiceAndScroll: (service: ServiceType, title: string) => void;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export function ServiceProvider({ children }: { children: ReactNode }) {
  const [selectedService, setSelectedServiceState] = useState<ServiceType>(null);
  const [selectedServiceTitle, setSelectedServiceTitle] = useState<string | null>(null);

  const setSelectedService = (service: ServiceType) => {
    setSelectedServiceState(service);
    if (service === null) setSelectedServiceTitle(null);
  };

  const selectServiceAndScroll = (service: ServiceType, title: string) => {
    setSelectedServiceState(service);
    setSelectedServiceTitle(title);

    // Scroll to contact section
    const contactElement = document.getElementById("contact");
    if (contactElement) {
      const headerHeight = 80; // Account for fixed header height
      const elementPosition = contactElement.offsetTop - headerHeight;

      window.scrollTo({
        top: elementPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <ServiceContext.Provider
      value={{
        selectedService,
        selectedServiceTitle,
        setSelectedService,
        selectServiceAndScroll,
      }}
    >
      {children}
    </ServiceContext.Provider>
  );
}

export function useService() {
  const context = useContext(ServiceContext);
  if (context === undefined) {
    throw new Error("useService must be used within a ServiceProvider");
  }
  return context;
}