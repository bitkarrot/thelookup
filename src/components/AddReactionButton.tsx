import { useState } from 'react';
import { NostrEvent } from '@nostrify/nostrify';
import { useReactToComment } from '@/hooks/useReactToComment';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SmilePlus } from 'lucide-react';

interface AddReactionButtonProps {
  comment: NostrEvent;
}

// Common emoji reactions (Slack-style)
const COMMON_REACTIONS = [
  '👍', '👎', '❤️', '😂', '😮', '😢', '😡',
  '🎉', '🔥', '👀', '💯', '🚀', '✅', '❌'
];

export function AddReactionButton({ comment }: AddReactionButtonProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { user } = useCurrentUser();
  const { mutate: reactToComment, isPending } = useReactToComment();

  const handleReaction = (reaction: string) => {
    if (!user) return;
    reactToComment({ comment, reaction });
    setShowEmojiPicker(false);
  };

  if (!user) {
    return null;
  }

  return (
    <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          disabled={isPending}
        >
          <SmilePlus className="h-3 w-3 mr-1" />
          React
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Add a reaction</h4>
          <div className="grid grid-cols-7 gap-1">
            {COMMON_REACTIONS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                onClick={() => handleReaction(emoji)}
                className="h-8 w-8 p-0 text-lg hover:bg-muted rounded"
                disabled={isPending}
              >
                {emoji}
              </Button>
            ))}
          </div>

        </div>
      </PopoverContent>
    </Popover>
  );
}