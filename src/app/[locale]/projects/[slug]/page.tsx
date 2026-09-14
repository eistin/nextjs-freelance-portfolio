import { notFound } from 'next/navigation';
import { getAllProjects, getProjectBySlug } from '@/lib/projects';
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

  const params = await Promise.all(
    locales.map(async (locale) => {
      const projects = await getAllProjects(locale);
      return projects.map((project) => ({
        locale,
        slug: project.slug,
      }));
    })
  );

  return params.flat();
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