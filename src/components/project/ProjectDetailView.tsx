'use client';

import { ArrowLeft, Calendar, Clock, Users, Target, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { Project } from '@/lib/projects';
import { Badge } from '@/components/ui/badge';

interface ProjectDetailViewProps {
  project: Project;
}

export function ProjectDetailView({ project }: ProjectDetailViewProps) {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('projectDetail');
  const { metadata, content } = project;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between py-6">
            <button
              onClick={() => {
                // Navigate to home page with locale and scroll to projects section
                window.location.href = `/${locale}/#projects`;
              }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} />
              {t('backToProjects')}
            </button>
            <Badge variant="outline" className="text-xs font-mono">
              {metadata.category}
            </Badge>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="border-b border-border">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {metadata.title}
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              {metadata.challenge}
            </p>
            
            {/* Project Meta */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Calendar size={20} className="text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t('client')}</div>
                  <div className="font-semibold">{metadata.client}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Clock size={20} className="text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t('duration')}</div>
                  <div className="font-semibold">{metadata.duration}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Users size={20} className="text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t('teamSize')}</div>
                  <div className="font-semibold">{metadata.teamSize}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <TrendingUp size={20} className="text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t('impact')}</div>
                  <div className="font-semibold text-primary">{t('success')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Technologies */}
      <div className="border-b border-border">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-sm font-mono text-muted-foreground mb-4">{t('technologiesUsed')}</h2>
            <div className="flex flex-wrap gap-2">
              {metadata.technologies.map((tech) => (
                <Badge key={tech} variant="secondary" className="text-sm">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight, rehypeRaw]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-3xl font-bold mt-12 mb-6 text-foreground border-b border-border pb-4">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl font-semibold mt-8 mb-3 text-foreground">
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-lg font-semibold mt-6 mb-2 text-foreground">
                    {children}
                  </h4>
                ),
                p: ({ children }) => (
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-muted-foreground">{children}</li>
                ),
                code: ({ children, className }) => {
                  const isBlock = className?.includes('language-');
                  return isBlock ? (
                    <code className={className}>{children}</code>
                  ) : (
                    <code className="bg-muted text-primary px-2 py-1 rounded text-sm font-mono">
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => (
                  <pre className="bg-muted border border-border rounded-lg p-4 overflow-x-auto mb-6" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                    {children}
                  </pre>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary pl-6 py-2 mb-6 bg-muted/30 rounded-r-lg">
                    <div className="text-muted-foreground italic">{children}</div>
                  </blockquote>
                ),
                strong: ({ children }) => (
                  <strong className="text-foreground font-semibold">{children}</strong>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="text-primary hover:text-primary/80 underline transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-collapse border border-border">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-border bg-muted px-4 py-2 text-left font-semibold text-foreground">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-border px-4 py-2 text-muted-foreground">
                    {children}
                  </td>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Impact Summary */}
      <div className="border-t border-border bg-muted/30">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Target size={24} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold">{t('projectImpact')}</h2>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {metadata.impact}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}