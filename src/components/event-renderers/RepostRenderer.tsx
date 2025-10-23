import type { NostrEvent } from '@nostrify/nostrify';
import { Badge } from '@/components/ui/badge';
import { Repeat } from 'lucide-react';
import { NoteContent } from '@/components/NoteContent';

interface RepostRendererProps {
  event: NostrEvent;
}

export function RepostRenderer({ event }: RepostRendererProps) {
  const eTag = event.tags.find(([name]) => name === 'e')?.[1];
  const pTag = event.tags.find(([name]) => name === 'p')?.[1];
  const kTag = event.tags.find(([name]) => name === 'k')?.[1];
  const qTag = event.tags.find(([name]) => name === 'q')?.[1];
  
  const hasComment = event.content.trim().length > 0;
  const isGenericRepost = event.kind === 16;

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 text-muted-foreground">
        <Repeat className="h-4 w-4" />
        <span className="text-sm">
          {isGenericRepost ? 'Generic Repost' : 'Repost'}
        </span>
      </div>

      {hasComment && (
        <div className="border-l-2 border-muted pl-4">
          <div className="text-sm text-muted-foreground mb-2">Comment:</div>
          <div className="whitespace-pre-wrap break-words">
            <NoteContent event={event} />
          </div>
        </div>
      )}

      <div className="space-y-2 text-sm text-muted-foreground">
        {(eTag || qTag) && (
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {qTag ? 'Quoted Event' : 'Event'}
            </Badge>
            <span className="font-mono text-xs">
              {(qTag || eTag)!.slice(0, 16)}...
            </span>
          </div>
        )}
        
        {pTag && (
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">Author</Badge>
            <span className="font-mono text-xs">{pTag.slice(0, 16)}...</span>
          </div>
        )}
        
        {kTag && (
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">Kind</Badge>
            <span className="text-xs">{kTag}</span>
          </div>
        )}
      </div>

      {isGenericRepost && event.content && (
        <div className="bg-muted p-3 rounded-lg">
          <div className="text-xs text-muted-foreground mb-2">Reposted Event:</div>
          <pre className="text-xs overflow-auto">
            {event.content}
          </pre>
        </div>
      )}
    </div>
  );
}