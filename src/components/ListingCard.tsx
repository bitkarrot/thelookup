import { Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { ExternalLink } from 'lucide-react';
import type { BusinessStallInfo } from '@/hooks/useListings';

interface ListingCardProps {
  listing: BusinessStallInfo;
  renderDescription: (text: string, makeLinksClickable?: boolean) => React.ReactNode;
  onNavigate: (path: string) => void;
}

export function ListingCard({ listing, renderDescription, onNavigate }: ListingCardProps) {
  const author = useAuthor(listing.pubkey);
  const authorMetadata = author.data?.metadata;

  return (
    <Card 
      className="h-full flex flex-col sm:rounded-lg rounded-none hover:border-primary/50 transition-colors cursor-pointer"
      onClick={() => onNavigate(`/listings/${encodeURIComponent(listing.stallId)}`)}
    >
        <CardHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {listing.image && (
                <AvatarImage src={listing.image} alt={listing.name} />
              )}
              <AvatarFallback>
                {listing.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{listing.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
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
        </CardHeader>
        <CardContent className="space-y-2">
          {listing.description && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {renderDescription(listing.description, false)}
            </p>
          )}
          {listing.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {listing.tags.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <div className="pt-3 flex flex-wrap gap-2">
            {listing.website && (
              <Button
                type="button"
                size="sm"
                className="h-8 px-3 text-xs sm:text-sm bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(listing.website as string, '_blank', 'noopener,noreferrer');
                }}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Open
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs sm:text-sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onNavigate(`/listings/${encodeURIComponent(listing.stallId)}`);
              }}
            >
              Details
            </Button>
          </div>
        </CardContent>
    </Card>
  );
}
