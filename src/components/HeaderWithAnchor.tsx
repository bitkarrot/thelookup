import { Link } from 'lucide-react';
import { slugify } from '@/lib/utils';

interface HeaderWithAnchorProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
}

export function HeaderWithAnchor({ level, children, className, ...props }: HeaderWithAnchorProps) {
  const text = typeof children === 'string' ? children : extractTextFromChildren(children);
  const id = slugify(text);
  
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  
  return (
    <Tag id={id} className={`group ${className}`} {...props}>
      <a href={`#${id}`} className="inline-flex items-center flex-wrap gap-x-2 no-underline hover:no-underline">
        <span className="flex-1 min-w-0">{children}</span>
        <Link className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-muted-foreground flex-shrink-0 -mt-0.5" />
      </a>
    </Tag>
  );
}

function extractTextFromChildren(children: React.ReactNode): string {
  if (typeof children === 'string') {
    return children;
  }
  
  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join('');
  }
  
  if (children && typeof children === 'object' && 'props' in children) {
    return extractTextFromChildren((children as { props: { children: React.ReactNode } }).props.children);
  }
  
  return '';
}