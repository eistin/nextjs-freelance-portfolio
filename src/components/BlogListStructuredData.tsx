import { BlogPost } from '@/lib/blog';

interface BlogListStructuredDataProps {
  posts: BlogPost[];
  locale: string;
}

export function BlogListStructuredData({ posts, locale }: BlogListStructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://edwindev.cloud";
  const blogUrl = `${baseUrl}/${locale}/blog`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": locale === 'fr' ? "Blog DevOps & SRE par Edwin Istin" : "Edwin Istin DevOps & SRE Blog",
    "description": locale === 'fr' 
      ? "Conseils DevOps et SRE par Edwin Istin. Tutoriels, bonnes pratiques et conseils d'expert sur Kubernetes, Infrastructure as Code, CI/CD et architecture cloud."
      : "DevOps and SRE insights from Edwin Istin. Tutorials, best practices, and expert guidance on Kubernetes, Infrastructure as Code, CI/CD, and cloud architecture.",
    "url": blogUrl,
    "author": {
      "@type": "Person",
      "name": "Edwin Istin",
      "url": `${baseUrl}/${locale}`,
      "sameAs": [
        "https://twitter.com/Stini46111608",
        "https://www.linkedin.com/in/edwin-istin/",
        "https://github.com/edwinistin"
      ]
    },
    "publisher": {
      "@type": "Organization",
      "name": "Edwin Istin",
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/cloud-icon.png`,
        "width": 512,
        "height": 512
      }
    },
    "inLanguage": locale,
    "blogPost": posts.map(post => ({
      "@type": "BlogPosting",
      "headline": post.metadata.title,
      "description": post.metadata.excerpt,
      "url": `${baseUrl}/${locale}/blog/${post.slug}`,
      "datePublished": post.metadata.publishedAt,
      "author": {
        "@type": "Person",
        "name": post.metadata.author
      },
      "keywords": post.metadata.tags,
      "articleSection": post.metadata.category,
      "image": post.slug === 'hpa-vs-vpa-vs-keda' 
        ? `${baseUrl}/blog/hpa-vs-vpa-vs-keda.png`
        : `${baseUrl}/cloud-icon.png`
    })),
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": posts.map((post, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "BlogPosting",
          "name": post.metadata.title,
          "url": `${baseUrl}/${locale}/blog/${post.slug}`
        }
      }))
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2),
      }}
    />
  );
}