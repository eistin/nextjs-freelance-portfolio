import { getAllBlogPosts } from '@/lib/blog';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { BlogListStructuredData } from '@/components/BlogListStructuredData';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

interface BlogPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://edwindev.cloud";
  const currentUrl = `${baseUrl}/${locale}/blog`;

  return {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
    authors: [{ name: "Edwin Istin" }],
    creator: "Edwin Istin",
    publisher: "Edwin Istin",
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
      type: "website",
      locale: locale,
      url: currentUrl,
      title: t("ogTitle"),
      description: t("ogDescription"),
      siteName: "Edwin Istin Portfolio",
      images: [
        {
          url: "/cloud-icon.png",
          width: 1200,
          height: 630,
          alt: t("ogTitle"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("twitterTitle"),
      description: t("twitterDescription"),
      images: ["/cloud-icon.png"],
      creator: "@Stini46111608",
    },
    alternates: {
      canonical: currentUrl,
      languages: {
        "en": `${baseUrl}/en/blog`,
        "fr": `${baseUrl}/fr/blog`,
        "x-default": `${baseUrl}/en/blog`,
      },
    },
  };
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { locale } = await params;
  const blogPosts = await getAllBlogPosts(locale);
  const t = await getTranslations({ locale, namespace: "blog" });

  return (
    <div className="min-h-screen bg-white">
      <BlogListStructuredData posts={blogPosts} locale={locale} />
      
      {/* Top Navigation */}
      <section className="pt-8 pb-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href={`/${locale}`}>
            <Button variant="outline" className="cursor-pointer">
              {t("backToHome")}
            </Button>
          </Link>
          <LanguageSwitcher />
        </div>
      </section>

      {/* Header */}
      <section className="pt-16 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-4">
            {t("pageTitle")}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t("pageSubtitle")}
          </p>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {blogPosts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600 text-lg">{t("noPosts")}</p>
            </div>
          ) : (
            <div className="space-y-12">
              {blogPosts.map((post) => (
                <article 
                  key={post.slug} 
                  className="group border-b border-gray-100 pb-12 last:border-b-0"
                >
                  <Link href={`/${locale}/blog/${post.slug}`}>
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                      {/* Featured Image */}
                      <div className="w-full md:w-80 h-48 bg-gray-100 rounded-lg overflow-hidden shrink-0 group-hover:opacity-90 transition-opacity relative">
                        {post.metadata.image ? (
                          <Image
                            src={post.metadata.image}
                            alt={post.metadata.title}
                            width={320}
                            height={192}
                            className="w-full h-full object-cover"
                            sizes="(max-width: 768px) 100vw, 320px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <div className="text-center">
                              <Tag className="w-8 h-8 mx-auto mb-2" />
                              <p className="text-sm">{t("featuredImage")}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
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

                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">
                          {post.metadata.title}
                        </h2>

                        <p className="text-gray-600 text-base leading-relaxed mb-4">
                          {post.metadata.excerpt}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.metadata.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500">
                            {t("by")} {post.metadata.author}
                          </p>
                          <span className="text-primary font-medium group-hover:underline">
                            {t("readMore")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}