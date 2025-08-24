import { notFound } from 'next/navigation';
import { getProjectBySlug, getProjectSlugs } from '@/lib/projects';
import { ProjectDetailView } from '@/components/project/ProjectDetailView';
import { setRequestLocale, getTranslations } from 'next-intl/server';

interface PageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const locales = ['en', 'fr'];
  
  return locales.flatMap((locale) => {
    const slugs = getProjectSlugs(locale);
    return slugs.map((slug) => ({
      locale,
      slug,
    }));
  });
}

export async function generateMetadata({ params }: PageProps) {
  const { slug, locale } = await params;
  const project = await getProjectBySlug(slug, locale);
  
  if (!project) {
    const t = await getTranslations({ locale, namespace: 'errors' });
    return {
      title: t('projectNotFound'),
    };
  }

  return {
    title: `${project.metadata.title} - Edwin Istin`,
    description: project.metadata.challenge,
    keywords: project.metadata.technologies.join(', '),
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  
  const project = await getProjectBySlug(slug, locale);

  if (!project) {
    notFound();
  }

  return <ProjectDetailView project={project} />;
}