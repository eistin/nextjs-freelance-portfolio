import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface BlogMetadata {
  title: string;
  excerpt: string;
  author: string;
  publishedAt: string;
  tags: string[];
  featured: boolean;
  readTime: string;
  category: string;
}

export interface BlogPost {
  slug: string;
  metadata: BlogMetadata;
  content: string;
}

const blogDirectory = path.join(process.cwd(), 'content/blog');

export async function getBlogPostBySlug(slug: string, locale: string = 'en'): Promise<BlogPost | null> {
  try {
    const fullPath = path.join(blogDirectory, locale, `${slug}.md`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      slug,
      metadata: data as BlogMetadata,
      content,
    };
  } catch {
    // Fallback to English if the requested locale doesn't exist
    if (locale !== 'en') {
      return getBlogPostBySlug(slug, 'en');
    }
    return null;
  }
}

export async function getAllBlogPosts(locale: string = 'en'): Promise<BlogPost[]> {
  try {
    const localeDirectory = path.join(blogDirectory, locale);
    const fileNames = fs.readdirSync(localeDirectory);
    const blogPosts = await Promise.all(
      fileNames
        .filter((name) => name.endsWith('.md'))
        .map(async (name) => {
          const slug = name.replace(/\.md$/, '');
          return getBlogPostBySlug(slug, locale);
        })
    );

    return blogPosts
      .filter((post): post is BlogPost => post !== null)
      .sort((a, b) => new Date(b.metadata.publishedAt).getTime() - new Date(a.metadata.publishedAt).getTime());
  } catch {
    // Fallback to English if locale directory doesn't exist
    if (locale !== 'en') {
      return getAllBlogPosts('en');
    }
    return [];
  }
}

export function getBlogSlugs(locale: string = 'en'): string[] {
  try {
    const localeDirectory = path.join(blogDirectory, locale);
    const fileNames = fs.readdirSync(localeDirectory);
    return fileNames
      .filter((name) => name.endsWith('.md'))
      .map((name) => name.replace(/\.md$/, ''));
  } catch {
    // Fallback to English if locale directory doesn't exist
    if (locale !== 'en') {
      return getBlogSlugs('en');
    }
    return [];
  }
}