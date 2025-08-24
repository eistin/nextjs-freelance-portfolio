"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type ServiceType = "infrastructure" | "cicd" | "kubernetes" | "cloud" | null;

interface ServiceContextType {
  selectedService: ServiceType;
  setSelectedService: (service: ServiceType) => void;
  selectServiceAndScroll: (service: ServiceType) => void;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export function ServiceProvider({ children }: { children: ReactNode }) {
  const [selectedService, setSelectedService] = useState<ServiceType>(null);

  const selectServiceAndScroll = (service: ServiceType) => {
    setSelectedService(service);
    
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