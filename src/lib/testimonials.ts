import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface TestimonialMetadata {
  name: string;
  role: string;
  company: string;
  featured: boolean;
  avatar: string;
  rating: number;
  publishedAt: string;
}

export interface Testimonial {
  slug: string;
  metadata: TestimonialMetadata;
  content: string;
}

const testimonialsDirectory = path.join(process.cwd(), 'content/testimonials');

export async function getTestimonialBySlug(slug: string, locale: string = 'en'): Promise<Testimonial | null> {
  try {
    const fullPath = path.join(testimonialsDirectory, locale, `${slug}.md`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      slug,
      metadata: data as TestimonialMetadata,
      content,
    };
  } catch {
    // Fallback to English if the requested locale doesn't exist
    if (locale !== 'en') {
      return getTestimonialBySlug(slug, 'en');
    }
    return null;
  }
}

export async function getAllTestimonials(locale: string = 'en'): Promise<Testimonial[]> {
  try {
    const localeDirectory = path.join(testimonialsDirectory, locale);
    const fileNames = fs.readdirSync(localeDirectory);
    const testimonials = await Promise.all(
      fileNames
        .filter((name) => name.endsWith('.md'))
        .map(async (name) => {
          const slug = name.replace(/\.md$/, '');
          return getTestimonialBySlug(slug, locale);
        })
    );

    return testimonials
      .filter((testimonial): testimonial is Testimonial => testimonial !== null)
      .sort((a, b) => new Date(b.metadata.publishedAt).getTime() - new Date(a.metadata.publishedAt).getTime());
  } catch {
    // Fallback to English if locale directory doesn't exist
    if (locale !== 'en') {
      return getAllTestimonials('en');
    }
    return [];
  }
}

export async function getFeaturedTestimonials(locale: string = 'en'): Promise<Testimonial[]> {
  const allTestimonials = await getAllTestimonials(locale);
  return allTestimonials.filter(testimonial => testimonial.metadata.featured);
}

export function getTestimonialSlugs(locale: string = 'en'): string[] {
  try {
    const localeDirectory = path.join(testimonialsDirectory, locale);
    const fileNames = fs.readdirSync(localeDirectory);
    return fileNames
      .filter((name) => name.endsWith('.md'))
      .map((name) => name.replace(/\.md$/, ''));
  } catch {
    // Fallback to English if locale directory doesn't exist
    if (locale !== 'en') {
      return getTestimonialSlugs('en');
    }
    return [];
  }
}