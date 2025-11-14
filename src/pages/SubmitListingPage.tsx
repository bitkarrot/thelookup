import { Layout } from '@/components/Layout';
import { BusinessListingForm } from '@/components/BusinessListingForm';
import { useSeoMeta } from '@unhead/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPageTitle, getPageDescription } from '@/lib/siteConfig';

export default function SubmitListingPage() {
  const paymentEnabled = import.meta.env.VITE_SUBMIT_LISTING_PAYMENT_ENABLED === 'true';
  const feeAmount = parseInt(import.meta.env.VITE_SUBMIT_LISTING_FEE || '0', 10);
  const lightningAddress = import.meta.env.VITE_SUBMIT_LISTING_LIGHTNING_ADDRESS;
  const isPaymentEnabled = paymentEnabled && lightningAddress && feeAmount > 0;

  useSeoMeta({
    title: getPageTitle('Submit Listing'),
    description: getPageDescription(
      'Submit a business listing to the directory as a NIP-99 classified listing.',
    ),
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/listings">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Listings
            </Link>
          </Button>
        </div>

        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-medium text-blue-900 dark:text-blue-100">About Listings</h3>
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                  <p>
                    When you submit a listing, you're creating a <strong>NIP-99 classified listing</strong> event
                    (kind 30402) that describes a product, service, or other offer.
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Your listing will be discoverable by users browsing the directory</li>
                    <li>Listings are stored on the Nostr network rather than centralized servers</li>
                    {isPaymentEnabled ? (
                      <li className="text-yellow-700 dark:text-yellow-300">
                        <strong>
                          New listing submissions require a {feeAmount} sat Lightning payment
                        </strong>{' '}
                        to prevent spam (future edits could be made free or cheaper).
                      </li>
                    ) : (
                      <li className="text-green-700 dark:text-green-300">
                        New listing submissions are currently free
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <BusinessListingForm />
      </div>
    </Layout>
  );
}
