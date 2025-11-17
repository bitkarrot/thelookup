import { useNavigate, useParams } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { Layout } from '@/components/Layout';
import { getPageTitle, getPageDescription } from '@/lib/siteConfig';
import { useListings } from '@/hooks/useListings';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RelaySelector } from '@/components/RelaySelector';
import { Button } from '@/components/ui/button';
import { useDeleteListing } from '@/hooks/useDeleteListing';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTrigger,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { BusinessListingForm } from '@/components/BusinessListingForm';

export default function EditListingPage() {
  const { stallId } = useParams<{ stallId: string }>();
  const { data: listings, isLoading, error } = useListings();
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const { mutate: deleteListing, isPending: isDeleting } = useDeleteListing();

  const normalizedParam = stallId ? decodeURIComponent(stallId).toLowerCase() : '';
  const listing =
    listings?.find((item) => {
      const stallIdLower = item.stallId.toLowerCase();
      const dTagLower = item.dTag.toLowerCase();
      return stallIdLower === normalizedParam || dTagLower === normalizedParam;
    }) || null;

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

  const isOwner = user?.pubkey === listing.pubkey;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-0 space-y-4">
        {isOwner ? (
          <>
            <div className="flex justify-end">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Listing
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{listing.name}"? This will publish a NIP-09
                      deletion request for this stall and may remove it from compatible clients.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => {
                        deleteListing(
                          { stall: listing },
                          {
                            onSuccess: () => {
                              navigate('/listings');
                            },
                          },
                        );
                      }}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <BusinessListingForm existingStall={listing} mode="edit" />
          </>
        ) : (
          <Card className="sm:rounded-lg rounded-none">
            <CardHeader>
              <CardTitle>Edit Listing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                You do not have permission to edit this listing. Only the creator can update it.
              </p>
              <RelaySelector className="w-full" />
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
