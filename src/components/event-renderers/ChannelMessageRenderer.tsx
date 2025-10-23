import type { NostrEvent } from '@nostrify/nostrify';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Hash } from 'lucide-react';
import { NoteContent } from '@/components/NoteContent';

interface ChannelMessageRendererProps {
  event: NostrEvent;
}

export function ChannelMessageRenderer({ event }: ChannelMessageRendererProps) {
  const eTag = event.tags.find(([name]) => name === 'e')?.[1]; // Channel ID
  const pTag = event.tags.find(([name]) => name === 'p')?.[1]; // Mentioned user
  const replyToTag = event.tags.find(([name, , , marker]) => name === 'e' && marker === 'reply')?.[1];
  const rootTag = event.tags.find(([name, , , marker]) => name === 'e' && marker === 'root')?.[1];

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <MessageCircle className="h-4 w-4 text-muted-foreground" />
        <Badge variant="default">Channel Message</Badge>
      </div>

      {eTag && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Hash className="h-4 w-4" />
          <span>Channel:</span>
          <span className="font-mono text-xs">{eTag.slice(0, 16)}...</span>
        </div>
      )}

      <div className="whitespace-pre-wrap break-words">
        <NoteContent event={event} />
      </div>

      {(replyToTag || rootTag || pTag) && (
        <div className="space-y-2 text-sm text-muted-foreground border-t pt-3">
          {rootTag && (
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">Root</Badge>
              <span className="font-mono text-xs">{rootTag.slice(0, 16)}...</span>
            </div>
          )}
          
          {replyToTag && replyToTag !== rootTag && (
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">Reply To</Badge>
              <span className="font-mono text-xs">{replyToTag.slice(0, 16)}...</span>
            </div>
          )}
          
          {pTag && (
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">Mentions</Badge>
              <span className="font-mono text-xs">{pTag.slice(0, 16)}...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}