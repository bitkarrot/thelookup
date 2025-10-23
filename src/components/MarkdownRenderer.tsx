import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { CodeBlock } from '@/components/CodeBlock';
import { HeaderWithAnchor } from '@/components/HeaderWithAnchor';
import { useTheme } from '@/components/AppProvider';
import { useEffect } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  const { theme } = useTheme();

  useEffect(() => {
    // Remove any existing highlight.js stylesheets
    const existingLinks = document.querySelectorAll('link[data-highlight-theme]');
    existingLinks.forEach(link => link.remove());

    // Dynamically import the appropriate theme stylesheet
    const importTheme = async () => {
      try {
        if (theme === 'dark') {
          await import('highlight.js/styles/github-dark.css');
        } else {
          await import('highlight.js/styles/github.css');
        }
      } catch (error) {
        console.warn('Failed to load highlight.js theme:', error);
      }
    };

    importTheme();
  }, [theme]);

  return (
    <div className={`prose prose-slate prose-lg max-w-4xl mx-auto dark:prose-invert prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-p:mb-4 prose-p:leading-relaxed prose-ul:mb-4 prose-ol:mb-4 prose-li:mb-1 prose-pre:bg-muted/50 prose-pre:border prose-pre:border-primary/20 prose-pre:p-4 prose-pre:rounded-lg prose-pre:my-4 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Custom link handling to open external links in new tab
          a: ({ href, children, ...props }) => {
            const isExternal = href?.startsWith('http');
            return (
              <a
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="text-accent hover:text-accent/80 underline transition-colors duration-200"
                {...props}
              >
                {children}
              </a>
            );
          },
          // Custom paragraph styling
          p: ({ children, ...props }) => (
            <p className="mb-4 leading-relaxed text-base" {...props}>
              {children}
            </p>
          ),
          // Custom heading styling with anchors
          h1: ({ children, ...props }) => (
            <HeaderWithAnchor level={1} className="text-3xl font-bold mb-6 mt-8 first:mt-0" {...props}>
              {children}
            </HeaderWithAnchor>
          ),
          h2: ({ children, ...props }) => (
            <HeaderWithAnchor level={2} className="text-2xl font-bold mb-4 mt-8 first:mt-0" {...props}>
              {children}
            </HeaderWithAnchor>
          ),
          h3: ({ children, ...props }) => (
            <HeaderWithAnchor level={3} className="text-xl font-bold mb-3 mt-6 first:mt-0" {...props}>
              {children}
            </HeaderWithAnchor>
          ),
          h4: ({ children, ...props }) => (
            <HeaderWithAnchor level={4} className="text-lg font-bold mb-2 mt-4 first:mt-0" {...props}>
              {children}
            </HeaderWithAnchor>
          ),
          h5: ({ children, ...props }) => (
            <HeaderWithAnchor level={5} className="text-base font-bold mb-2 mt-4 first:mt-0" {...props}>
              {children}
            </HeaderWithAnchor>
          ),
          h6: ({ children, ...props }) => (
            <HeaderWithAnchor level={6} className="text-sm font-bold mb-2 mt-4 first:mt-0" {...props}>
              {children}
            </HeaderWithAnchor>
          ),
          // Custom code block with copy button
          pre: ({ children, ...props }) => (
            <CodeBlock {...props}>
              {children}
            </CodeBlock>
          ),
          // Custom inline code styling
          code: ({ children, className, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  className="bg-primary/10 text-accent px-1.5 py-0.5 rounded font-mono border border-primary/20 text-[0.875em]"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            // For code blocks, don't add extra styling as it's handled by pre
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          // Custom list styling
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-inside mb-4 space-y-1" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal list-inside mb-4 space-y-1" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="mb-1" {...props}>
              {children}
            </li>
          ),
          // Custom blockquote styling
          blockquote: ({ children, ...props }) => (
            <blockquote className="border-l-4 border-primary/30 pl-4 italic my-4 text-foreground/90 bg-muted/30 py-2 rounded-r-md" {...props}>
              {children}
            </blockquote>
          ),
          // Custom table styling
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600" {...props}>
                {children}
              </table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 px-4 py-2 text-left font-semibold text-gray-900 dark:text-gray-100" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2" {...props}>
              {children}
            </td>
          ),
          // Custom horizontal rule styling
          hr: ({ ...props }) => (
            <hr className="my-8 border-gray-300 dark:border-gray-600" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}