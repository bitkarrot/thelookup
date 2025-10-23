import type { NostrEvent } from '@nostrify/nostrify';
import { Badge } from '@/components/ui/badge';
import { Heart, ThumbsUp, ThumbsDown } from 'lucide-react';

interface ReactionRendererProps {
  event: NostrEvent;
}

export function ReactionRenderer({ event }: ReactionRendererProps) {
  const reactionContent = event.content;
  const eTag = event.tags.find(([name]) => name === 'e')?.[1];
  const pTag = event.tags.find(([name]) => name === 'p')?.[1];
  const kTag = event.tags.find(([name]) => name === 'k')?.[1];

  const getReactionIcon = (content: string) => {
    switch (content) {
      case '+':
      case '👍':
        return <ThumbsUp className="h-4 w-4" />;
      case '-':
      case '👎':
        return <ThumbsDown className="h-4 w-4" />;
      case '❤️':
      case '♥️':
        return <Heart className="h-4 w-4 fill-current text-red-500" />;
      default:
        return <span className="text-lg">{content}</span>;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-muted-foreground">Reacted with:</span>
        <div className="flex items-center space-x-2">
          {getReactionIcon(reactionContent)}
          {reactionContent && reactionContent !== '+' && reactionContent !== '-' && (
            <span className="text-sm">{reactionContent}</span>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        {eTag && (
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">Event</Badge>
            <span className="font-mono text-xs">{eTag.slice(0, 16)}...</span>
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
    </div>
  );
}