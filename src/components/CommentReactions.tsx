import { NostrEvent } from '@nostrify/nostrify';
import { useCommentReactions } from '@/hooks/useCommentReactions';
import { useReactToComment } from '@/hooks/useReactToComment';
import { useDeleteReaction } from '@/hooks/useDeleteReaction';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface CommentReactionsProps {
  comment: NostrEvent;
  className?: string;
}

export function CommentReactions({ comment, className }: CommentReactionsProps) {
  const { user } = useCurrentUser();
  const { data: reactions = [] } = useCommentReactions(comment);
  const { mutate: reactToComment, isPending: isReacting } = useReactToComment();
  const { mutate: deleteReaction, isPending: isDeleting } = useDeleteReaction();

  const handleToggleReaction = (reaction: string, hasUserReacted: boolean) => {
    if (!user) return;
    
    if (hasUserReacted) {
      // Delete the reaction using kind 5
      deleteReaction({ comment, reaction });
    } else {
      // Add the reaction
      reactToComment({ comment, reaction });
    }
  };

  const isPending = isReacting || isDeleting;

  // Don't show anything if no reactions
  if (reactions.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {/* Existing reactions */}
      {reactions.map((reactionData) => (
        <TooltipProvider key={reactionData.content}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleReaction(reactionData.content, reactionData.hasUserReacted)}
                disabled={!user || isPending}
                className={cn(
                  "h-7 px-2 py-1 text-xs rounded-full border transition-all",
                  reactionData.hasUserReacted 
                    ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20" 
                    : "bg-muted/50 border-muted hover:bg-muted",
                  isPending && "opacity-50"
                )}
              >
                <span className="mr-1">{reactionData.content}</span>
                <span className="font-medium">{reactionData.count}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                {reactionData.count} {reactionData.count === 1 ? 'person' : 'people'} reacted with {reactionData.content}
                {reactionData.hasUserReacted && ' (including you)'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
}