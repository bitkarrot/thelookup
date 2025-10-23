import type { NostrEvent } from '@nostrify/nostrify';
import { Badge } from '@/components/ui/badge';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { Calendar, Clock, FileText, Tag } from 'lucide-react';

interface LongFormContentRendererProps {
  event: NostrEvent;
}

export function LongFormContentRenderer({ event }: LongFormContentRendererProps) {
  const titleTag = event.tags.find(([name]) => name === 'title')?.[1];
  const summaryTag = event.tags.find(([name]) => name === 'summary')?.[1];
  const publishedAtTag = event.tags.find(([name]) => name === 'published_at')?.[1];
  const imageTag = event.tags.find(([name]) => name === 'image')?.[1];
  const dTag = event.tags.find(([name]) => name === 'd')?.[1];
  const hashtags = event.tags.filter(([name]) => name === 't').map(([, tag]) => tag);
  
  const isDraft = event.kind === 30024;
  const publishedDate = publishedAtTag 
    ? new Date(parseInt(publishedAtTag) * 1000)
    : new Date(event.created_at * 1000);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <Badge variant={isDraft ? "secondary" : "default"}>
            {isDraft ? 'Draft Article' : 'Published Article'}
          </Badge>
          {dTag && (
            <Badge variant="outline" className="text-xs font-mono">
              {dTag}
            </Badge>
          )}
        </div>

        {titleTag && (
          <h1 className="text-2xl font-bold leading-tight">{titleTag}</h1>
        )}

        {summaryTag && (
          <p className="text-muted-foreground text-lg leading-relaxed">
            {summaryTag}
          </p>
        )}

        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{publishedDate.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{publishedDate.toLocaleTimeString()}</span>
          </div>
        </div>

        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {hashtags.map((hashtag, index) => (
              <div key={index} className="flex items-center space-x-1">
                <Tag className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                  {hashtag}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Featured Image */}
      {imageTag && (
        <div className="rounded-lg overflow-hidden">
          <img
            src={imageTag}
            alt={titleTag || 'Article image'}
            className="w-full h-64 object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <MarkdownRenderer content={event.content} />
      </div>
    </div>
  );
}