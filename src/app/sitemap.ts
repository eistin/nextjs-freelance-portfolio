import { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { projects } from '@/lib/projects';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://edwindev.cloud';

  // Main pages for each locale
  const mainPages = [
    '',
    '/recent-work',
  ];

  // Generate URLs for main pages in all locales
  const mainUrls = routing.locales.flatMap((locale) =>
    mainPages.map((page) => ({
      url: `${baseUrl}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: page === '' ? 1 : 0.8,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((lang) => [lang, `${baseUrl}/${lang}${page}`])
        ),
      },
    }))
  );

  // Generate URLs for project pages in all locales
  const projectUrls = routing.locales.flatMap((locale) =>
    Object.keys(projects).map((projectId) => ({
      url: `${baseUrl}/${locale}/projects/${projectId}`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.6,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((lang) => [lang, `${baseUrl}/${lang}/projects/${projectId}`])
        ),
      },
    }))
  );

  return [
    // Root redirect
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    ...mainUrls,
    ...projectUrls,
  ];
}