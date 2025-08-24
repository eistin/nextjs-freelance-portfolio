import { getTranslations } from 'next-intl/server';

export async function StructuredData({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'metadata' });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://edwindev.cloud';

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Edwin Istin",
    "jobTitle": locale === 'fr' ? "Ingénieur DevOps & SRE" : "DevOps & SRE Engineer",
    "description": t('description'),
    "url": baseUrl,
    "sameAs": [
      "https://www.linkedin.com/in/edwinistin",
      "https://github.com/edwinistin",
      "https://twitter.com/edwinistin"
    ],
    "email": "istin.edwin@gmail.com",
    "telephone": "+33616281484",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Rennes",
      "addressRegion": "Bretagne",
      "addressCountry": "FR"
    },
    "worksFor": {
      "@type": "Organization",
      "name": "Freelance",
      "url": baseUrl
    },
    "knowsAbout": [
      "DevOps",
      "Site Reliability Engineering",
      "Infrastructure as Code",
      "CI/CD",
      "Kubernetes",
      "Google Cloud Platform",
      "Terraform",
      "Ansible",
      "Docker",
      "GitOps",
      "Prometheus",
      "Grafana"
    ],
    "image": `${baseUrl}/edwin-profile.jpg`,
    "hasOccupation": {
      "@type": "Occupation",
      "name": locale === 'fr' ? "Ingénieur DevOps" : "DevOps Engineer",
      "occupationLocation": {
        "@type": "City",
        "name": "Rennes, France"
      },
      "skills": [
        "Infrastructure as Code",
        "Kubernetes",
        "CI/CD Pipelines",
        "Cloud Architecture",
        "Site Reliability Engineering",
        "Monitoring and Observability"
      ]
    },
    "offers": {
      "@type": "Service",
      "name": locale === 'fr' ? "Services DevOps & SRE" : "DevOps & SRE Services",
      "description": locale === 'fr' 
        ? "Services de conseil en infrastructure cloud, automatisation DevOps, et ingénierie de fiabilité de site"
        : "Cloud infrastructure consulting, DevOps automation, and site reliability engineering services",
      "provider": {
        "@type": "Person",
        "name": "Edwin Istin"
      },
      "serviceType": [
        "Infrastructure as Code",
        "CI/CD Implementation",
        "Kubernetes Migration",
        "Cloud Architecture",
        "Site Reliability Engineering",
        "DevOps Consulting"
      ],
      "areaServed": "Worldwide"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2),
      }}
    />
  );
}