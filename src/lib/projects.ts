import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface ProjectMetadata {
  title: string;
  category: string;
  client: string;
  duration: string;
  teamSize: string;
  technologies: string[];
  featured: boolean;
  publishedAt: string;
  challenge: string;
  impact: string;
}

export interface Project {
  slug: string;
  metadata: ProjectMetadata;
  content: string;
}

const projectsDirectory = path.join(process.cwd(), 'content/projects');

export async function getProjectBySlug(slug: string, locale: string = 'en'): Promise<Project | null> {
  try {
    const fullPath = path.join(projectsDirectory, locale, `${slug}.md`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      slug,
      metadata: data as ProjectMetadata,
      content,
    };
  } catch {
    // Fallback to English if the requested locale doesn't exist
    if (locale !== 'en') {
      return getProjectBySlug(slug, 'en');
    }
    return null;
  }
}

export async function getAllProjects(locale: string = 'en'): Promise<Project[]> {
  try {
    const localeDirectory = path.join(projectsDirectory, locale);
    const fileNames = fs.readdirSync(localeDirectory);
    const projects = await Promise.all(
      fileNames
        .filter((name) => name.endsWith('.md'))
        .map(async (name) => {
          const slug = name.replace(/\.md$/, '');
          return getProjectBySlug(slug, locale);
        })
    );

    return projects
      .filter((project): project is Project => project !== null)
      .sort((a, b) => new Date(b.metadata.publishedAt).getTime() - new Date(a.metadata.publishedAt).getTime());
  } catch {
    // Fallback to English if locale directory doesn't exist
    if (locale !== 'en') {
      return getAllProjects('en');
    }
    return [];
  }
}

export function getProjectSlugs(locale: string = 'en'): string[] {
  try {
    const localeDirectory = path.join(projectsDirectory, locale);
    const fileNames = fs.readdirSync(localeDirectory);
    return fileNames
      .filter((name) => name.endsWith('.md'))
      .map((name) => name.replace(/\.md$/, ''));
  } catch {
    // Fallback to English if locale directory doesn't exist
    if (locale !== 'en') {
      return getProjectSlugs('en');
    }
    return [];
  }
}