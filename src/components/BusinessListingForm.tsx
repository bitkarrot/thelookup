import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { LoginArea } from '@/components/auth/LoginArea';
import { TagInput } from '@/components/TagInput';
import { ListingSubmissionPaymentDialog } from '@/components/ListingSubmissionPaymentDialog';
import { Store, CreditCard } from 'lucide-react';
import { useListingSubmissionPayment } from '@/hooks/useListingSubmissionPayment';

interface BusinessListingFormData {
  title: string;
  summary: string;
  description: string;
  image: string;
  location: string;
  priceAmount: string;
  priceCurrency: string;
  priceFrequency: string;
  status: string;
  tags: string[];
}

export function BusinessListingForm() {
  const { user } = useCurrentUser();
  const { mutate: publishEvent, isPending } = useNostrPublish();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { isPaymentRequired, paymentConfig } = useListingSubmissionPayment();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<BusinessListingFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BusinessListingFormData>({
    defaultValues: {
      title: '',
      summary: '',
      description: '',
      image: '',
      location: '',
      priceAmount: '',
      priceCurrency: 'USD',
      priceFrequency: '',
      status: 'active',
      tags: [],
    },
  });

  const watchedTags = watch('tags');

  const submitListingToRelay = (data: BusinessListingFormData) => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    const dTag = Math.random().toString(36).substring(2, 15);

    const tags: string[][] = [
      ['d', dTag],
      ['title', data.title.trim()],
    ];

    if (data.summary.trim()) tags.push(['summary', data.summary.trim()]);
    if (data.location.trim()) tags.push(['location', data.location.trim()]);
    if (data.image.trim()) tags.push(['image', data.image.trim(), '256x256']);
    if (data.status.trim()) tags.push(['status', data.status.trim()]);

    if (data.priceAmount.trim() && data.priceCurrency.trim()) {
      tags.push([
        'price',
        data.priceAmount.trim(),
        data.priceCurrency.trim(),
        data.priceFrequency.trim() || undefined,
      ] as unknown as string[]);
    }

    tags.push(...data.tags.map((tag) => ['t', tag]));

    const content = data.description.trim();

    toast({
      title: 'Publishing Listing',
      description: 'Sending your business listing to the Nostr network...',
    });

    publishEvent(
      {
        kind: 30402,
        content,
        tags,
      },
      {
        onSuccess: (event) => {
          setIsSubmitting(false);
          toast({
            title: 'Listing Submitted Successfully!',
            description: 'Your listing has been published to the Nostr network.',
          });

          const dTagFromEvent = event.tags.find(([name]) => name === 'd')?.[1];
          if (dTagFromEvent) {
            navigate('/listings');
          } else {
            reset();
          }
        },
        onError: (error) => {
          setIsSubmitting(false);
          toast({
            title: 'Submission Failed',
            description:
              error instanceof Error ? error.message : 'Failed to submit listing.',
            variant: 'destructive',
          });
        },
      },
    );
  };

  const onSubmit = (data: BusinessListingFormData) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to submit a listing.',
        variant: 'destructive',
      });
      return;
    }

    if (!data.title.trim() || !data.description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide at least a title and description.',
        variant: 'destructive',
      });
      return;
    }

    if (isPaymentRequired && paymentConfig) {
      setPendingFormData(data);
      setShowPaymentDialog(true);
      toast({
        title: 'Payment Required',
        description: `A payment of ${paymentConfig.feeAmount} sats is required for new listings.`,
      });
    } else {
      submitListingToRelay(data);
    }
  };

  const handlePaymentConfirmed = () => {
    if (pendingFormData && !isSubmitting) {
      setShowPaymentDialog(false);

      toast({
        title: 'Payment Confirmed',
        description: 'Payment verified! Submitting your listing to the network...',
      });

      setTimeout(() => {
        if (pendingFormData) {
          const dataToSubmit = pendingFormData;
          setPendingFormData(null);
          submitListingToRelay(dataToSubmit);
        }
      }, 500);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Store className="h-5 w-5" />
            <span>Submit Business Listing</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Please log in to submit a new business listing.
            </p>
            <LoginArea className="max-w-60 mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Store className="h-5 w-5" />
          <span>Submit Business Listing</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...register('title', { required: 'Title is required' })}
                placeholder="e.g., Web Design Services"
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Input
                id="summary"
                {...register('summary')}
                placeholder="Short tagline for your listing"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                {...register('description', { required: 'Description is required' })}
                placeholder="Describe your product or service in detail (Markdown supported)"
                rows={5}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                {...register('image')}
                placeholder="https://example.com/image.png"
                type="url"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                {...register('location')}
                placeholder="City, Country or Region"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceAmount">Amount</Label>
                <Input
                  id="priceAmount"
                  {...register('priceAmount')}
                  placeholder="e.g., 50"
                  type="number"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceCurrency">Currency</Label>
                <Input
                  id="priceCurrency"
                  {...register('priceCurrency')}
                  placeholder="e.g., USD"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceFrequency">Frequency</Label>
                <Input
                  id="priceFrequency"
                  {...register('priceFrequency')}
                  placeholder="e.g., month, year (optional)"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Input
                id="status"
                {...register('status')}
                placeholder="active or sold"
              />
            </div>

            <TagInput
              tags={watchedTags}
              onTagsChange={(tags) => setValue('tags', tags)}
              label="Tags (optional)"
              placeholder="e.g., design, consulting, software"
              description="Add tags to help users discover your listing. Press Enter, comma, Tab, or space to add."
            />
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isPending || isSubmitting}
              className="min-w-32"
            >
              {isPending || isSubmitting ? (
                'Submitting...'
              ) : isPaymentRequired ? (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay & Submit Listing
                </>
              ) : (
                'Submit Listing'
              )}
            </Button>
          </div>
        </form>
      </CardContent>

      <ListingSubmissionPaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        onPaymentConfirmed={handlePaymentConfirmed}
      />
    </Card>
  );
}
