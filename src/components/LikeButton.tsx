import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNipLikes } from '@/hooks/useNipLikes';
import { useLikeNip } from '@/hooks/useLikeNip';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cn } from '@/lib/utils';
import type { NostrEvent } from '@nostrify/nostrify';

interface LikeButtonProps {
  event: NostrEvent;
  naddr?: string;
  className?: string;
  showCount?: boolean;
}

export function LikeButton({ event, naddr, className, showCount = true }: LikeButtonProps) {
  const { user } = useCurrentUser();
  const { data: likesData, isLoading } = useNipLikes(event);
  const { mutate: likeNip, isPending } = useLikeNip();

  const handleLike = () => {
    if (!user) return;
    likeNip({ event, naddr });
  };

  const isLiked = likesData?.isLikedByUser || false;
  const likeCount = likesData?.likeCount || 0;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      disabled={!user || isPending || isLoading}
      className={cn(
        "flex items-center gap-1.5 transition-colors",
        isLiked && "text-yellow-500 hover:text-yellow-600",
        !isLiked && "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      <Star 
        className={cn(
          "h-4 w-4 transition-all",
          isLiked && "fill-current",
          isPending && "animate-pulse"
        )} 
      />
      {showCount && likeCount > 0 && (
        <span className="text-sm font-medium">{likeCount}</span>
      )}
    </Button>
  );
}