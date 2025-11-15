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
import type { BusinessStallInfo } from '@/hooks/useListings';

interface BusinessListingFormData {
  title: string;
  description: string;
  image: string;
  location: string;
  currency: string;
  status: 'active' | 'draft';
  tags: string[];
}

interface BusinessListingFormProps {
  existingStall?: BusinessStallInfo;
  mode?: 'create' | 'edit';
}

export function BusinessListingForm({ existingStall, mode: _mode = 'create' }: BusinessListingFormProps) {
  const { user } = useCurrentUser();
  const { mutate: publishEvent, isPending } = useNostrPublish();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { isPaymentRequired, paymentConfig } = useListingSubmissionPayment();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<BusinessListingFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // NIP-15 stall shipping zones
  type ShippingZoneForm = {
    id: string;
    name: string;
    cost: string;
    regions: string;
  };

  const initialShippingZones: ShippingZoneForm[] = existingStall
    ? existingStall.shipping.map((zone) => ({
        id: zone.id,
        name: zone.name ?? '',
        cost: zone.cost ? String(zone.cost) : '',
        regions: Array.isArray(zone.regions) ? zone.regions.join(', ') : '',
      }))
    : [];

  const [shippingZones, setShippingZones] = useState<ShippingZoneForm[]>(initialShippingZones);
  const [newShippingZone, setNewShippingZone] = useState<ShippingZoneForm>({
    id: '',
    name: '',
    cost: '',
    regions: '',
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BusinessListingFormData>({
    defaultValues: {
      title: existingStall?.name ?? '',
      description: existingStall?.description ?? '',
      image: existingStall?.image ?? '',
      location: '',
      currency: existingStall?.currency ?? 'USD',
      status: 'active',
      tags: existingStall?.tags ?? [],
    },
  });

  const watchedTags = watch('tags');
  const watchedCurrency = watch('currency');

  const submitListingToRelay = (data: BusinessListingFormData) => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    // Generate a stall id and ensure d-tag matches it per NIP-15
    // For edits, reuse the existing stall id so the new event replaces the old one.
    const stallId = existingStall?.stallId ?? Math.random().toString(36).substring(2, 15);

    const trimmedImage = data.image.trim();

    let tags: string[][];

    if (existingStall) {
      // Start from existing tags and preserve non-d/t/image tags (e.g. g tags)
      const preservedTags = existingStall.event.tags.filter(
        ([name]) => name !== 'd' && name !== 't' && name !== 'image',
      );

      const imageTags: string[][] = trimmedImage ? [['image', trimmedImage]] : [];

      tags = [
        ['d', stallId],
        ...preservedTags,
        ...imageTags,
        // Use t-tags as categories for the stall
        ...data.tags.map((tag) => ['t', tag]),
      ];
    } else {
      // New stall: build tags from scratch
      const imageTags: string[][] = trimmedImage ? [['image', trimmedImage]] : [];

      tags = [
        ['d', stallId],
        ...imageTags,
        // Use t-tags as categories for the stall
        ...data.tags.map((tag) => ['t', tag]),
      ];
    }

    // NIP-15 stall content
    const parsedShipping = shippingZones
      .filter((zone) => zone.id.trim())
      .map((zone) => ({
        id: zone.id.trim(),
        name: zone.name.trim() || undefined,
        cost: parseFloat(zone.cost || '0') || 0,
        regions: zone.regions
          .split(',')
          .map((r) => r.trim())
          .filter(Boolean),
      }));

    // Start from original JSON content for edits so we don't drop unknown fields
    type StallContent = {
      id?: string;
      name?: string;
      description?: string;
      currency?: string;
      shipping?: unknown;
      image?: string;
      location?: string;
      status?: string;
      // Allow arbitrary extra keys from other clients
      [key: string]: unknown;
    };

    let baseContent: StallContent = {};
    if (existingStall) {
      try {
        baseContent = JSON.parse(existingStall.event.content || '{}');
      } catch {
        baseContent = {};
      }
    }

    const shippingUnchanged =
      existingStall && JSON.stringify(shippingZones) === JSON.stringify(initialShippingZones);

    const stallContent: StallContent = {
      ...(existingStall ? baseContent : {}),
      id: stallId,
      name: data.title.trim(),
      description: data.description.trim() || undefined,
      currency: (data.currency || 'USD').trim() || 'USD',
      image: data.image.trim() || undefined,
      location: data.location.trim() || undefined,
      status: data.status,
    };

    if (existingStall) {
      if (!shippingUnchanged) {
        stallContent.shipping = parsedShipping;
      }
      // if shipping is unchanged, leave baseContent.shipping as-is to preserve countries/other fields
    } else {
      stallContent.shipping = parsedShipping;
    }

    const content = JSON.stringify(stallContent);

    toast({
      title: 'Publishing Listing',
      description: 'Sending your business listing to the Nostr network...',
    });

    publishEvent(
      {
        kind: 30017,
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

    // Only require payment for initial submissions, not edits
    const shouldRequirePayment = !existingStall && isPaymentRequired && paymentConfig;

    if (shouldRequirePayment) {
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

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                {...register('currency')}
                placeholder="e.g., USD"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Shipping Zones</h3>
            <p className="text-sm text-muted-foreground">
              Define the shipping zones for this stall (business). Customers will choose one of these zones
              at checkout. Regions are comma-separated (for example: US, CA, EU).
            </p>

            {/* New shipping zone inputs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="shippingZoneId">Zone ID</Label>
                <Input
                  id="shippingZoneId"
                  value={newShippingZone.id}
                  onChange={(e) => setNewShippingZone({ ...newShippingZone, id: e.target.value })}
                  placeholder="zone-id"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shippingZoneName">Name</Label>
                <Input
                  id="shippingZoneName"
                  value={newShippingZone.name}
                  onChange={(e) => setNewShippingZone({ ...newShippingZone, name: e.target.value })}
                  placeholder="e.g., North America"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shippingZoneCost">Base Cost</Label>
                <Input
                  id="shippingZoneCost"
                  type="number"
                  min="0"
                  value={newShippingZone.cost}
                  onChange={(e) => setNewShippingZone({ ...newShippingZone, cost: e.target.value })}
                  placeholder="e.g., 10.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shippingZoneRegions">Regions</Label>
                <div className="flex space-x-2">
                  <Input
                    id="shippingZoneRegions"
                    value={newShippingZone.regions}
                    onChange={(e) => setNewShippingZone({ ...newShippingZone, regions: e.target.value })}
                    placeholder="US, CA, EU"
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={!newShippingZone.id.trim()}
                    onClick={() => {
                      if (!newShippingZone.id.trim()) return;
                      setShippingZones([
                        ...shippingZones,
                        {
                          id: newShippingZone.id.trim(),
                          name: newShippingZone.name.trim(),
                          cost: newShippingZone.cost.trim(),
                          regions: newShippingZone.regions.trim(),
                        },
                      ]);
                      setNewShippingZone({ id: '', name: '', cost: '', regions: '' });
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Existing shipping zones list */}
            {shippingZones.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Defined Zones</h4>
                <div className="space-y-2">
                  {shippingZones.map((zone, index) => (
                    <div
                      key={zone.id + index.toString()}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 border rounded"
                    >
                      <div className="text-xs sm:text-sm space-y-1">
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="font-mono">{zone.id}</span>
                          {zone.name && <span className="text-muted-foreground">{zone.name}</span>}
                        </div>
                        <div className="text-muted-foreground">
                          Cost: {zone.cost || '0'} ({watchedCurrency || 'USD'})
                        </div>
                        {zone.regions && (
                          <div className="text-muted-foreground">Regions: {zone.regions}</div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setShippingZones(shippingZones.filter((_, i) => i !== index))
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                {...register('status')}
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
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
                existingStall ? 'Saving...' : 'Submitting...'
              ) : existingStall ? (
                'Save Changes'
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
