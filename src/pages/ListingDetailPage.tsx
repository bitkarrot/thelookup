import { useParams, Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { Layout } from '@/components/Layout';
import { getPageTitle, getPageDescription } from '@/lib/siteConfig';
import { useListings } from '@/hooks/useListings';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Store, ArrowLeft, Calendar, Edit, ExternalLink } from 'lucide-react';
import { RelaySelector } from '@/components/RelaySelector';

export default function ListingDetailPage() {
  const { stallId } = useParams<{ stallId: string }>();
  const { data: listings, isLoading, error } = useListings();
  const { user } = useCurrentUser();

  const normalizedParam = stallId ? decodeURIComponent(stallId).toLowerCase() : '';
  const listing =
    listings?.find((item) => {
      const stallIdLower = item.stallId.toLowerCase();
      const dTagLower = item.dTag.toLowerCase();
      return stallIdLower === normalizedParam || dTagLower === normalizedParam;
    }) || null;

  useSeoMeta({
    title: getPageTitle(listing ? listing.name : 'Business Listing'),
    description: getPageDescription(
      listing?.description || 'View details for this NIP-15 business stall.',
    ),
  });

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-0">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/listings">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Listings
          </Link>
        </Button>

        {isLoading && (
          <Card className="sm:rounded-lg rounded-none">
            <CardContent className="py-12 px-8 text-center text-muted-foreground">
              Loading listing...
            </CardContent>
          </Card>
        )}

        {error && !isLoading && (
          <Card className="sm:rounded-lg rounded-none">
            <CardContent className="py-12 px-8 text-center">
              <div className="space-y-4 max-w-sm mx-auto">
                <p className="text-muted-foreground">
                  Failed to load listings. Try switching relays.
                </p>
                <RelaySelector className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && !listing && (
          <Card className="sm:rounded-lg rounded-none">
            <CardContent className="py-12 px-8 text-center">
              <div className="space-y-4 max-w-sm mx-auto">
                <Store className="h-10 w-10 text-muted-foreground mx-auto" />
                <h2 className="text-lg font-semibold">Listing Not Found</h2>
                <p className="text-muted-foreground">
                  This listing could not be found on the current relay.
                </p>
                <RelaySelector className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && listing && (
          <div className="space-y-6">
            <Card className="sm:rounded-lg rounded-none">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary/20">
                      {listing.image && (
                        <AvatarImage src={listing.image} alt={listing.name} />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                        {listing.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <CardTitle className="text-2xl font-bold leading-tight">
                        {listing.name}
                      </CardTitle>
                      {listing.description && (
                        <p className="text-muted-foreground leading-relaxed">
                          {listing.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Added {new Date(listing.createdAt * 1000).toLocaleDateString()}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Store className="h-4 w-4" />
                          Stall ID: <span className="font-mono text-xs">{listing.stallId}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end items-stretch gap-2 w-full md:w-auto">
                    {listing.website && (
                      <Button
                        type="button"
                        size="sm"
                        className="w-full md:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground"
                        onClick={() => {
                          window.open(listing.website as string, '_blank', 'noopener,noreferrer');
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Website
                      </Button>
                    )}

                    <Button
                      type="button"
                      size="sm"
                      className="w-full md:w-auto bg-violet-600 hover:bg-violet-500 text-primary-foreground"
                      onClick={() => {
                        const url = `https://plebeian.market/community/${listing.pubkey}:${listing.stallId}`;
                        window.open(url, '_blank', 'noopener,noreferrer');
                      }}
                    >
                      View on Plebeian Market
                    </Button>

                    {user?.pubkey === listing.pubkey && (
                      <Button
                        variant="outline"
                        asChild
                        size="sm"
                        className="w-full md:w-auto"
                      >
                        <Link to={`/listings/${encodeURIComponent(listing.stallId)}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Listing
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 sm:rounded-lg rounded-none">
                <CardHeader>
                  <CardTitle>Nostr Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Currency</span>
                    <span className="font-medium">{listing.currency}</span>
                  </div>

                  {listing.tags.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {listing.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Accordion type="single" collapsible className="border rounded-md">
                    <AccordionItem value="raw-stall-info">
                      <AccordionTrigger className="px-3 text-sm font-medium">
                        Raw Stall Info
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-3 pt-0 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground">Event JSON</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const json = JSON.stringify(listing.event, null, 2);
                              if (navigator.clipboard?.writeText) {
                                navigator.clipboard.writeText(json).catch(() => {
                                  // silent failure – no UI toast system imported here
                                });
                              }
                            }}
                          >
                            Copy JSON
                          </Button>
                        </div>
                        <pre className="bg-muted text-xs p-3 rounded-md overflow-x-auto">
                          <code>{JSON.stringify(listing.event, null, 2)}</code>
                        </pre>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

              <Card className="sm:rounded-lg rounded-none">
                <CardHeader>
                  <CardTitle>Shipping Zones</CardTitle>
                </CardHeader>
                <CardContent>
                  {listing.shipping.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No shipping zones defined for this stall.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {listing.shipping.map((zone) => (
                        <div key={zone.id} className="border rounded-md p-2 text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground font-medium">
                              {zone.name || 'Shipping'}
                            </span>
                          </div>
                          <div className="text-muted-foreground">
                            Cost: {zone.cost} ({listing.currency})
                          </div>
                          {Array.isArray(zone.regions) && zone.regions.length > 0 && (
                            <div className="text-muted-foreground">
                              Regions: {zone.regions.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
