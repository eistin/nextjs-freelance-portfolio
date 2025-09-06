import { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { getProjectSlugs } from '@/lib/projects';
import { getBlogSlugs } from '@/lib/blog';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://edwindev.cloud';

  // Main pages for each locale
  const mainPages = [
    '',
    '/recent-work',
    '/blog',
  ];

  // Generate URLs for main pages in all locales
  const mainUrls = routing.locales.flatMap((locale) =>
    mainPages.map((page) => ({
      url: `${baseUrl}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: page === '' ? 1 : page === '/blog' ? 0.9 : 0.8,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((lang) => [lang, `${baseUrl}/${lang}${page}`])
        ),
      },
    }))
  );

  // Get project slugs and generate URLs for project pages in all locales
  const projectSlugs = getProjectSlugs('en'); // Get English slugs as reference
  const projectUrls = routing.locales.flatMap((locale) =>
    projectSlugs.map((projectSlug) => ({
      url: `${baseUrl}/${locale}/projects/${projectSlug}`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.6,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((lang) => [lang, `${baseUrl}/${lang}/projects/${projectSlug}`])
        ),
      },
    }))
  );

  // Get blog slugs and generate URLs for blog posts in all locales
  const blogSlugs = getBlogSlugs('en'); // Get English slugs as reference
  const blogUrls = routing.locales.flatMap((locale) =>
    blogSlugs.map((blogSlug) => ({
      url: `${baseUrl}/${locale}/blog/${blogSlug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((lang) => [lang, `${baseUrl}/${lang}/blog/${blogSlug}`])
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
    ...blogUrls,
  ];
}