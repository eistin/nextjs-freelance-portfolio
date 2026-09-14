import fs from 'fs';
import path from 'path';
import { DEFAULT_ARTIFACT_PATH, getMissions, type MissionMetadata } from './profile';

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

/** Markdown bodies stay in this repo; metadata comes from the profile-hub artifact. */
function readBody(slug: string, locale: string): string {
  const preferred = path.join(projectsDirectory, locale, `${slug}.md`);
  const fallback = path.join(projectsDirectory, 'en', `${slug}.md`);
  const file = fs.existsSync(preferred) ? preferred : fallback;
  if (!fs.existsSync(file)) {
    throw new Error(
      `Mission "${slug}" has metadata in profile.json but no markdown body at ` +
        `content/projects/${locale}/${slug}.md (nor the "en" fallback). ` +
        `Mission metadata and case-study bodies live in different repos: add the ` +
        `markdown here, or remove the mission from profile-hub's content/missions/.`,
    );
  }
  return fs.readFileSync(file, 'utf8').trim();
}

/**
 * Builds ProjectMetadata explicitly rather than by rest-spread, so the
 * portfolio's public shape is pinned here and cannot drift if the artifact
 * grows new fields (period, for instance, is deliberately not surfaced).
 */
function toProject(mission: MissionMetadata, locale: string): Project {
  return {
    slug: mission.slug,
    metadata: {
      title: mission.title,
      category: mission.category,
      client: mission.client,
      duration: mission.duration,
      teamSize: mission.teamSize,
      technologies: mission.technologies,
      featured: mission.featured,
      publishedAt: mission.publishedAt,
      challenge: mission.challenge,
      impact: mission.impact,
    },
    content: readBody(mission.slug, locale),
  };
}

export async function getAllProjects(
  locale: string = 'en',
  artifactPath: string = DEFAULT_ARTIFACT_PATH,
): Promise<Project[]> {
  return getMissions(locale, artifactPath)
    .map((m) => toProject(m, locale))
    .sort((a, b) => new Date(b.metadata.publishedAt).getTime() - new Date(a.metadata.publishedAt).getTime());
}

export async function getProjectBySlug(
  slug: string,
  locale: string = 'en',
  artifactPath: string = DEFAULT_ARTIFACT_PATH,
): Promise<Project | null> {
  const mission = getMissions(locale, artifactPath).find((m) => m.slug === slug);
  return mission ? toProject(mission, locale) : null;
}
