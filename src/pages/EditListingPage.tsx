import { useParams } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { Layout } from '@/components/Layout';
import { getPageTitle, getPageDescription } from '@/lib/siteConfig';
import { useListings } from '@/hooks/useListings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RelaySelector } from '@/components/RelaySelector';
import { BusinessListingForm } from '@/components/BusinessListingForm';

export default function EditListingPage() {
  const { stallId } = useParams<{ stallId: string }>();
  const { data: listings, isLoading, error } = useListings();

  const listing = listings?.find((item) => item.stallId === stallId) || null;

  useSeoMeta({
    title: getPageTitle(listing ? `Edit ${listing.name}` : 'Edit Listing'),
    description: getPageDescription(
      listing?.description || 'Edit this NIP-15 business stall listing.',
    ),
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 sm:px-0">
          <Card className="sm:rounded-lg rounded-none">
            <CardContent className="py-12 px-8 text-center text-muted-foreground">
              Loading listing...
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (error || !listing) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 sm:px-0">
          <Card className="sm:rounded-lg rounded-none">
            <CardHeader>
              <CardTitle>Edit Listing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                This listing could not be found on the current relay.
              </p>
              <RelaySelector className="w-full" />
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-0">
        <BusinessListingForm existingStall={listing} mode="edit" />
      </div>
    </Layout>
  );
}
