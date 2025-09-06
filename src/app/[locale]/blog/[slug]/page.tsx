import { getBlogPostBySlug, getBlogSlugs } from '@/lib/blog';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { BlogStructuredData } from '@/components/BlogStructuredData';
import { Metadata } from 'next';

interface BlogPostPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export async function generateStaticParams() {
  // Generate paths for both locales
  const locales = ['en', 'fr'];
  const paths = [];

  for (const locale of locales) {
    const slugs = getBlogSlugs(locale);
    paths.push(...slugs.map((slug) => ({ locale, slug })));
  }

  return paths;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getBlogPostBySlug(slug, locale);

  if (!post) {
    return {
      title: 'Post Not Found - Edwin Istin Blog',
      description: 'The requested blog post could not be found.',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://edwindev.cloud";
  const currentUrl = `${baseUrl}/${locale}/blog/${slug}`;
  const imageUrl = slug === 'hpa-vs-vpa-vs-keda' 
    ? `${baseUrl}/blog/hpa-vs-vpa-vs-keda.png`
    : `${baseUrl}/cloud-icon.png`;

  // Create SEO-optimized title and description
  const seoTitle = `${post.metadata.title} | Edwin Istin Blog`;
  const seoDescription = post.metadata.excerpt.length > 155 
    ? post.metadata.excerpt.substring(0, 152) + '...'
    : post.metadata.excerpt;

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: post.metadata.tags.join(', ') + ', Edwin Istin, DevOps, SRE',
    authors: [{ name: post.metadata.author }],
    creator: post.metadata.author,
    publisher: post.metadata.author,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "article",
      locale: locale,
      url: currentUrl,
      title: post.metadata.title,
      description: seoDescription,
      siteName: "Edwin Istin Portfolio",
      publishedTime: post.metadata.publishedAt,
      authors: [post.metadata.author],
      tags: post.metadata.tags,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.metadata.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.metadata.title,
      description: seoDescription,
      images: [imageUrl],
      creator: "@Stini46111608",
    },
    alternates: {
      canonical: currentUrl,
      languages: {
        "en": `${baseUrl}/en/blog/${slug}`,
        "fr": `${baseUrl}/fr/blog/${slug}`,
        "x-default": `${baseUrl}/en/blog/${slug}`,
      },
    },
    other: {
      'article:author': post.metadata.author,
      'article:published_time': post.metadata.publishedAt,
      'article:section': post.metadata.category,
      'article:tag': post.metadata.tags.join(', '),
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { locale, slug } = await params;
  const post = await getBlogPostBySlug(slug, locale);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      <BlogStructuredData post={post} locale={locale} />
      
      {/* Top Navigation */}
      <section className="pt-8 pb-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href={`/${locale}/blog`}>
            <Button variant="outline" className="cursor-pointer">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
          <LanguageSwitcher />
        </div>
      </section>

      {/* Header */}
      <section className="pt-16 pb-16 px-6 border-b border-gray-100">
        <div className="max-w-4xl mx-auto">

          <div className="mb-6">
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(post.metadata.publishedAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.metadata.readTime}
              </div>
              <Badge variant="secondary">{post.metadata.category}</Badge>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
              {post.metadata.title}
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed mb-6">
              {post.metadata.excerpt}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {post.metadata.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>

            <p className="text-gray-500">
              By <span className="font-medium">{post.metadata.author}</span>
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <article className="prose prose-lg prose-gray max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code(props) {
                  const { className, children, ...rest } = props;
                  const match = /language-(\w+)/.exec(className || '');
                  
                  if (match) {
                    return (
                      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto my-4">
                        <code className={className} {...rest}>
                          {children}
                        </code>
                      </pre>
                    );
                  }
                  
                  return (
                    <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...rest}>
                      {children}
                    </code>
                  );
                },
                img({ src, alt }) {
                  if (typeof src !== 'string' || !src) {
                    return null;
                  }
                  
                  return (
                    <div className="my-8 text-center">
                      <Image
                        src={src}
                        alt={alt || ''}
                        width={800}
                        height={400}
                        className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
                      />
                      {alt && (
                        <p className="text-sm text-gray-600 mt-2 italic">{alt}</p>
                      )}
                    </div>
                  );
                },
                h1: ({ children }) => (
                  <h1 className="text-3xl font-bold mt-12 mb-4 text-gray-900">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-2xl font-bold mt-10 mb-3 text-gray-900">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl font-bold mt-8 mb-2 text-gray-900">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="mb-4 leading-relaxed text-gray-700">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="mb-4 space-y-2 list-disc list-inside">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-4 space-y-2 list-decimal list-inside">{children}</ol>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-gray-600">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="my-8 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-gray-50">
                    {children}
                  </thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="bg-white divide-y divide-gray-200">
                    {children}
                  </tbody>
                ),
                tr: ({ children }) => (
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    {children}
                  </tr>
                ),
                th: ({ children }) => (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 last:border-r-0">
                    {children}
                  </td>
                ),
              }}
            >
              {post.content}
            </ReactMarkdown>
          </article>
        </div>
      </section>

      {/* Back to Blog CTA */}
      <section className="py-16 px-6 border-t border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <Link href={`/${locale}/blog`}>
            <Button className="bg-primary text-white hover:bg-primary/90 cursor-pointer">
              ← Back to All Posts
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}