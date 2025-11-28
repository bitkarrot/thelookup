import { Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { ExternalLink } from 'lucide-react';
import type { BusinessStallInfo } from '@/hooks/useListings';

interface ListingListItemProps {
  listing: BusinessStallInfo;
  renderDescription: (text: string, makeLinksClickable?: boolean) => React.ReactNode;
  onNavigate: (path: string) => void;
}

export function ListingListItem({ listing, renderDescription, onNavigate }: ListingListItemProps) {
  const author = useAuthor(listing.pubkey);
  const authorMetadata = author.data?.metadata;

  return (
    <div 
      className="block hover:bg-accent/60 transition-colors cursor-pointer"
      onClick={() => onNavigate(`/listings/${encodeURIComponent(listing.stallId)}`)}
    >
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-8 w-8 flex-shrink-0">
              {listing.image && (
                <AvatarImage src={listing.image} alt={listing.name} />
              )}
              <AvatarFallback className="text-xs">
                {listing.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{listing.name}</h3>
              <p className="text-xs text-muted-foreground">
                by{' '}
                <Link
                  to={`/${nip19.npubEncode(listing.pubkey)}`}
                  className="hover:text-primary transition-colors hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {authorMetadata?.name || genUserName(listing.pubkey)}
                </Link>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {listing.website && (
              <Button
                type="button"
                size="sm"
                className="h-8 px-3 text-[10px] sm:text-xs bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(listing.website as string, '_blank', 'noopener,noreferrer');
                }}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Open
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-3 text-[10px] sm:text-xs"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onNavigate(`/listings/${encodeURIComponent(listing.stallId)}`);
              }}
            >
              Details
            </Button>
          </div>
        </div>
        {listing.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {renderDescription(listing.description, false)}
          </p>
        )}
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{listing.currency || 'Currency not specified'}</span>
          {listing.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {listing.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
