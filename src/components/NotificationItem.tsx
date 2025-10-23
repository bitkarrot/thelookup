import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuthor } from '@/hooks/useAuthor';
import { useNotificationReadState } from '@/hooks/useNotificationReadState';
import { genUserName } from '@/lib/genUserName';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, GitFork } from 'lucide-react';
import { NostrEvent } from '@/types/nostr';
import { NoteContent } from '@/components/NoteContent';
import { nip19 } from 'nostr-tools';
import { useAppConfig } from '@/components/AppProvider';

interface NotificationItemProps {
  event: NostrEvent;
}

export function NotificationItem({ event }: NotificationItemProps) {
  const author = useAuthor(event.pubkey);
  const metadata = author.data?.metadata;
  const { markAsRead, isRead } = useNotificationReadState();
  const { config } = useAppConfig();

  const displayName = metadata?.name ?? genUserName(event.pubkey);
  const profileImage = metadata?.picture;

  const isReaction = event.kind === 7;
  const isComment = event.kind === 1111;
  const isFork = event.kind === 30817 && event.tags.some(tag => tag[0] === 'a' && tag[3] === 'fork');
  const isUnread = !isRead(event.id);

  // Get the referenced NIP from the 'a' tag
  const aTag = event.tags.find(tag => tag[0] === 'a')?.[1];
  const nipTitle = isFork
    ? event.tags.find(tag => tag[0] === 'title')?.[1] || 'Untitled NIP'
    : getNipTitle(aTag);

  const timeAgo = formatDistanceToNow(new Date(event.created_at * 1000), { addSuffix: true });

  // Mark as read when the component is rendered (viewed)
  useEffect(() => {
    if (isUnread) {
      // Use a small delay to ensure the user actually sees the notification
      const timer = setTimeout(() => {
        markAsRead(event.id);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [event.id, isUnread, markAsRead]);

  return (
    <Card className={`hover:shadow-md transition-shadow ${isUnread ? 'bg-blue-50/50 border-blue-200' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Link to={`/${nip19.npubEncode(event.pubkey)}`}>
            <Avatar className="h-10 w-10 hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer">
              <AvatarImage src={profileImage} alt={displayName} />
              <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <Link
                to={`/${nip19.npubEncode(event.pubkey)}`}
                className="font-medium text-sm hover:text-primary transition-colors"
              >
                {displayName}
              </Link>
              {isUnread && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" aria-label="Unread notification" />
              )}
              {isReaction && (
                <Badge variant="secondary" className="text-xs">
                  <Heart className="h-3 w-3 mr-1" />
                  Liked
                </Badge>
              )}
              {isComment && (
                <Badge variant="secondary" className="text-xs">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Commented
                </Badge>
              )}
              {isFork && (
                <Badge variant="secondary" className="text-xs bg-orange-500/10 text-orange-500 border-orange-500/20">
                  <GitFork className="h-3 w-3 mr-1" />
                  Forked
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>

            <div className="text-sm text-muted-foreground mb-2">
              {isReaction && 'liked your NIP'}
              {isComment && 'commented on your NIP'}
              {isFork && 'forked your NIP'}
              {nipTitle && (
                <span className="font-medium text-foreground">
                  {' "'}
                  {nipTitle}
                  {'"'}
                </span>
              )}
            </div>

            {isComment && event.content && (
              <div className="text-sm bg-muted/50 rounded-md p-2 mt-2">
                <NoteContent event={event} className="text-sm" />
              </div>
            )}

            {(aTag || isFork) && (
              <div className="mt-2">
                <Link
                  to={isFork ? `/${createNaddrFromEvent(event, config.relayUrl)}` : `/${createNaddrFromATag(aTag!, config.relayUrl)}`}
                  className="text-xs text-primary hover:underline"
                >
                  View NIP →
                </Link>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getNipTitle(aTag: string | undefined): string | null {
  if (!aTag) return null;

  // aTag format: "kind:pubkey:identifier"
  const parts = aTag.split(':');
  if (parts.length >= 3) {
    const identifier = parts[2];
    // Try to extract a readable title from the identifier
    // This is a simple heuristic - in a real app you might want to fetch the actual event
    return identifier.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  return null;
}

function createNaddrFromATag(aTag: string, relayUrl: string): string {
  const parts = aTag.split(':');
  if (parts.length >= 3) {
    const [kind, pubkey, identifier] = parts;

    try {
      return nip19.naddrEncode({
        identifier,
        pubkey,
        kind: parseInt(kind, 10),
        relays: [relayUrl],
      });
    } catch (error) {
      console.warn('Failed to encode naddr:', error);
      return aTag;
    }
  }

  return aTag;
}

function createNaddrFromEvent(event: NostrEvent, relayUrl: string): string {
  const identifier = event.tags.find(tag => tag[0] === 'd')?.[1];

  if (identifier) {
    try {
      return nip19.naddrEncode({
        identifier,
        pubkey: event.pubkey,
        kind: event.kind,
        relays: [relayUrl],
      });
    } catch (error) {
      console.warn('Failed to encode naddr from event:', error);
      return event.id;
    }
  }

  return event.id;
}