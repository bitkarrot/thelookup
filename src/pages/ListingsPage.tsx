import { useSeoMeta } from '@unhead/react';
import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { useListings } from '@/hooks/useListings';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { RelaySelector } from '@/components/RelaySelector';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Search, Store, Plus, Grid3x3, List, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { getPageTitle, getPageDescription } from '@/lib/siteConfig';

function renderDescription(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);

  return parts.map((part, index) => {
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 text-primary break-words"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

export default function ListingsPage() {
  useSeoMeta({
    title: getPageTitle('Business Directory'),
    description: getPageDescription('Discover NIP-15 marketplace stalls (businesses) published on the Nostr network.'),
  });

  const { data: listings, isLoading, error } = useListings();
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  const allTags = useMemo(() => {
    const tags = listings?.flatMap((listing) => listing.tags || []) || [];
    return Array.from(new Set(tags)).sort();
  }, [listings]);

  const filteredListings =
    listings?.filter((listing) => {
      const matchesSearch =
        !searchTerm ||
        listing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTag = !selectedTag || listing.tags?.includes(selectedTag);

      return matchesSearch && matchesTag;
    }) || [];

  const totalListings = filteredListings.length;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="px-4 sm:px-0 space-y-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <div className="relative">
                <Store className="h-8 w-8 text-primary" />
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold title-shadow">Business Directory</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover businesses and marketplace stalls published on the Nostr network.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Store className="h-4 w-4" />
                  <span>{totalListings} Businesses</span>
                </div>
              </div>
              <Button asChild className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                <Link to="/listings/submit">
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Listing
                </Link>
              </Button>
            </div>
          </div>

          <Card className="sm:rounded-lg rounded-none">
            <CardHeader>
              <CardTitle className="text-lg">Find Listings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search listings by title, summary, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Filter by Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={selectedTag === null ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setSelectedTag(null)}
                    >
                      All Tags
                    </Badge>
                    {allTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={selectedTag === tag ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setSelectedTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading && (
          <div className="mt-6 text-center text-muted-foreground">Loading listings...</div>
        )}

        {error && (
          <div className="mt-6">
            <Card className="border-dashed sm:rounded-lg rounded-none mx-4 sm:mx-0">
              <CardContent className="py-12 px-8 text-center">
                <div className="max-w-sm mx-auto space-y-6">
                  <p className="text-muted-foreground">
                    Failed to load listings. Try switching to a different relay?
                  </p>
                  <RelaySelector className="w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {filteredListings.length > 0 ? (
              <>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6 px-4 sm:px-0">
                  <div>
                    <h2 className="text-xl font-semibold">All Businesses</h2>
                    <span className="text-sm text-muted-foreground mt-1">
                      {filteredListings.length}{' '}
                      {filteredListings.length === 1 ? 'business' : 'businesses'}
                    </span>
                  </div>

                  <ToggleGroup
                    type="single"
                    value={viewMode}
                    onValueChange={(value) => setViewMode(value as 'cards' | 'list')}
                    variant="outline"
                    size="sm"
                  >
                    <ToggleGroupItem value="list" aria-label="List view">
                      <List className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="cards" aria-label="Card view">
                      <Grid3x3 className="h-4 w-4" />
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                {viewMode === 'cards' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mt-6">
                    {filteredListings.map((listing) => (
                      <Link
                        key={listing.id}
                        to={`/listings/${encodeURIComponent(listing.stallId)}`}
                        className="block hover:no-underline"
                      >
                        <Card className="h-full flex flex-col sm:rounded-lg rounded-none hover:border-primary/50 transition-colors">
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
                              <CardTitle className="text-lg truncate">{listing.name}</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {listing.description && (
                              <p className="text-sm text-muted-foreground line-clamp-3">
                                {renderDescription(listing.description)}
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
                                  navigate(`/listings/${encodeURIComponent(listing.stallId)}`);
                                }}
                              >
                                Details
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Card className="sm:rounded-lg rounded-none mt-6">
                    <div className="divide-y">
                      {filteredListings.map((listing) => (
                        <Link
                          key={listing.id}
                          to={`/listings/${encodeURIComponent(listing.stallId)}`}
                          className="block hover:bg-accent/60 transition-colors"
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
                                <h3 className="font-semibold text-foreground truncate">{listing.name}</h3>
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
                                    navigate(`/listings/${encodeURIComponent(listing.stallId)}`);
                                  }}
                                >
                                  Details
                                </Button>
                              </div>
                            </div>
                          {listing.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {renderDescription(listing.description)}
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
                        </Link>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <div className="mt-6">
                <Card className="border-dashed sm:rounded-lg rounded-none mx-4 sm:mx-0">
                  <CardContent className="py-12 px-8 text-center">
                    <div className="max-w-sm mx-auto space-y-6">
                      <div className="space-y-2">
                        <Store className="h-12 w-12 text-muted-foreground mx-auto" />
                        <h3 className="text-lg font-medium">No Listings Found</h3>
                        <p className="text-muted-foreground">
                          {searchTerm || selectedTag
                            ? 'No listings match your current filters. Try adjusting your search or filters.'
                            : 'No listings found on this relay. Try switching to a different relay or submit a new listing.'}
                        </p>
                      </div>
                      {!searchTerm && !selectedTag && <RelaySelector className="w-full" />}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
