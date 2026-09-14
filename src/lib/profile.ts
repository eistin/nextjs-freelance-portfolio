import fs from 'fs';
import path from 'path';

export interface Skill { id: string; label: string; level: string; categories: string[] }
export interface Service { id: string; title: string; description: string }

export interface PortfolioProfile {
  identity: {
    name: string;
    headline: string;
    title: string;
    yearsExperience: number;
    links: { portfolio: string; linkedin: string; malt: string; collective: string; github: string };
  };
  bio: { short: string; medium: string; long: string };
  skills: Skill[];
  engagement: {
    availability: { status: string; from: string; daysPerWeek: number };
    remote: string;
  };
  stats: { experience: string; projects: string; satisfaction: string };
  services: Service[];
}

export interface MissionMetadata {
  slug: string;
  title: string;
  category: string;
  client: string;
  duration: string;
  period: { start: string; end: string };
  teamSize: string;
  technologies: string[];
  featured: boolean;
  publishedAt: string;
  challenge: string;
  impact: string;
}

interface Artifact {
  locales: Record<string, { profile: PortfolioProfile; missions: MissionMetadata[] }>;
}

export const DEFAULT_ARTIFACT_PATH = path.join(process.cwd(), 'profile.json');

const FALLBACK_LOCALE = 'en';

let cache: { file: string; data: Artifact } | null = null;

function readArtifact(file: string): Artifact {
  if (cache && cache.file === file) return cache.data;
  if (!fs.existsSync(file)) {
    throw new Error(
      `Missing ${file}. It is fetched from profile-hub at build time. ` +
        `Run "npm run profile:pull" locally, or check the CI checkout step.`,
    );
  }
  const data = JSON.parse(fs.readFileSync(file, 'utf8')) as Artifact;
  cache = { file, data };
  return data;
}

function localeSlice(locale: string, file: string) {
  const artifact = readArtifact(file);
  return artifact.locales[locale] ?? artifact.locales[FALLBACK_LOCALE];
}

export function getProfile(locale: string = FALLBACK_LOCALE, file: string = DEFAULT_ARTIFACT_PATH): PortfolioProfile {
  return localeSlice(locale, file).profile;
}

export function getMissions(locale: string = FALLBACK_LOCALE, file: string = DEFAULT_ARTIFACT_PATH): MissionMetadata[] {
  return localeSlice(locale, file).missions;
}
