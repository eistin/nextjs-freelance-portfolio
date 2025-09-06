import { BlogPost } from '@/lib/blog';

interface BlogStructuredDataProps {
  post: BlogPost;
  locale: string;
}

export function BlogStructuredData({ post, locale }: BlogStructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://edwindev.cloud";
  const postUrl = `${baseUrl}/${locale}/blog/${post.slug}`;
  const imageUrl = post.slug === 'hpa-vs-vpa-vs-keda' 
    ? `${baseUrl}/blog/hpa-vs-vpa-vs-keda.png`
    : `${baseUrl}/cloud-icon.png`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.metadata.title,
    "description": post.metadata.excerpt,
    "image": {
      "@type": "ImageObject",
      "url": imageUrl,
      "width": 1200,
      "height": 630
    },
    "author": {
      "@type": "Person",
      "name": post.metadata.author,
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
    "datePublished": post.metadata.publishedAt,
    "dateModified": post.metadata.publishedAt,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": postUrl
    },
    "url": postUrl,
    "isPartOf": {
      "@type": "Blog",
      "name": "Edwin Istin DevOps Blog",
      "@id": `${baseUrl}/${locale}/blog`
    },
    "inLanguage": locale,
    "keywords": post.metadata.tags,
    "articleSection": post.metadata.category,
    "wordCount": post.content.split(' ').length,
    "timeRequired": post.metadata.readTime,
    "about": {
      "@type": "Thing",
      "name": "DevOps",
      "description": "DevOps, Site Reliability Engineering, Infrastructure as Code, and Cloud Architecture"
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