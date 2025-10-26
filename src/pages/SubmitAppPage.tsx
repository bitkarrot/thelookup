import { Layout } from '@/components/Layout';
import { SubmitAppForm } from '@/components/SubmitAppForm';
import { useSeoMeta } from '@unhead/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPageTitle, getPageDescription } from '@/lib/siteConfig';

export default function SubmitAppPage() {
  useSeoMeta({
    title: getPageTitle('Submit App'),
    description: getPageDescription('Submit your Nostr application to the directory. Create a Handler Information event to make your app discoverable by users and other clients'),
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/apps">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Apps
            </Link>
          </Button>
        </div>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-medium text-blue-900 dark:text-blue-100">
                  About App Submissions
                </h3>
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                  <p>
                    When you submit an app, you're creating a <strong>Handler Information</strong> event (kind 31990) 
                    that tells other Nostr clients how your application can handle specific types of content.
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Your app will be discoverable by users looking for specialized applications</li>
                    <li>Other clients can redirect users to your app for supported event types</li>
                    <li>You can update your app information anytime by submitting again</li>
                    <li>All information is stored on the Nostr network, not on centralized servers</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Form */}
        <SubmitAppForm />
      </div>
    </Layout>
  );
}