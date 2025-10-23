import { useSeoMeta } from '@unhead/react';
import { Users, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nip19 } from 'nostr-tools';
import { useAppConfig } from '@/components/AppProvider';

import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RelaySelector } from '@/components/RelaySelector';
import { CommentsSection } from '@/components/CommentsSection';

import { useCommunity, extractCommunityMetadata } from '@/hooks/useCommunity';

// Hardcoded Nostr Developers community details
const COMMUNITY_PUBKEY = '0461fcbecc4c3374439932d6b8f11269ccdb7cc973ad7a50ae362db135a474dd';
const COMMUNITY_IDENTIFIER = 'nostr-developers-mbp9sz5o';

export default function CommunityPage() {
  const { config } = useAppConfig();

  useSeoMeta({
    title: 'Nostr Developers Community | NostrHub',
    description: 'Join the Nostr Developers community to discuss, share, and collaborate on Nostr protocol development.',
  });

  const { data: community, isLoading: communityLoading, error: communityError } = useCommunity(
    COMMUNITY_PUBKEY,
    COMMUNITY_IDENTIFIER
  );

  const communityMetadata = community ? extractCommunityMetadata(community) : null;

  // Create naddr for the community event to use with CommentsSection
  const communityNaddr = nip19.naddrEncode({
    kind: 34550,
    pubkey: COMMUNITY_PUBKEY,
    identifier: COMMUNITY_IDENTIFIER,
    relays: [config.relayUrl],
  });

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 px-0 sm:px-4">
        {/* Community Header */}
        {communityLoading ? (
          <Card>
            <CardHeader>
              <div className="space-y-3">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardHeader>
          </Card>
        ) : (communityError || !communityMetadata) ? (
          <Card className="border-destructive/50">
            <CardContent className="py-8 text-center">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-destructive">
                  Community Not Found
                </h2>
                <p className="text-muted-foreground">
                  The Nostr Developers community could not be loaded. Try switching to a different relay.
                </p>
                <RelaySelector className="max-w-sm mx-auto" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center space-x-3">
                    {communityMetadata.image && (
                      <img
                        src={communityMetadata.image}
                        alt={communityMetadata.name}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <CardTitle className="text-2xl">{communityMetadata.name}</CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{communityMetadata.moderators.length} moderators</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Created {formatDistanceToNow(new Date(communityMetadata.createdAt * 1000), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {communityMetadata.description && (
                    <p className="text-muted-foreground">{communityMetadata.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">NIP-72 Community</Badge>
                    <Badge variant="outline">Developers</Badge>
                    <Badge variant="outline">Nostr Protocol</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Community Discussion */}
        {(community && communityNaddr) && (
          <CommentsSection
            root={community}
            title="Community Discussion"
            emptyStateMessage="No posts in this community yet"
            emptyStateSubtitle="Be the first to share something with the community!"
          />
        )}
      </div>
    </Layout>
  );
}