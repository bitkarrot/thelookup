import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import type { BusinessStallInfo } from '@/hooks/useListings';
import { useListingFlags } from '@/hooks/useListingFlags';

interface ListingFlagDialogProps {
  listing: BusinessStallInfo;
  children: React.ReactNode;
}

export function ListingFlagDialog({ listing, children }: ListingFlagDialogProps) {
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState<string>('');
  const [content, setContent] = useState('');
  const { toast } = useToast();

  const { reportTypes, flagListing, isFlagging, canFlag, userFlag } = useListingFlags(
    listing.id,
    listing.pubkey,
    listing.dTag,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reportType || !content.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please select a report type and provide a description.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await flagListing({
        reportType: reportType as keyof typeof reportTypes,
        content: content.trim(),
      });

      toast({
        title: 'Flag submitted',
        description: 'Thank you for helping keep the directory safe.',
      });

      setOpen(false);
      setReportType('');
      setContent('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit flag. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (userFlag) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Flag Already Submitted
            </DialogTitle>
            <DialogDescription>
              You have already flagged this listing. Thank you for helping keep the directory safe.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Report Type</Label>
              <p className="text-sm font-medium mt-1">
                {reportTypes[userFlag.reportType as keyof typeof reportTypes]}
              </p>
            </div>
            <div>
              <Label>Description</Label>
              <p className="text-sm text-muted-foreground mt-1">{userFlag.content}</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild disabled={!canFlag}>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Flag Listing: {listing.name}
          </DialogTitle>
          <DialogDescription>
            Report this listing for policy violations. False reports may result in account suspension.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="listing-report-type">Report Type *</Label>
            <RadioGroup value={reportType} onValueChange={setReportType}>
              {Object.entries(reportTypes).map(([key, description]) => (
                <div key={key} className="flex items-center space-x-2">
                  <RadioGroupItem value={key} id={`listing-report-${key}`} />
                  <Label htmlFor={`listing-report-${key}`} className="flex-1 cursor-pointer">
                    <div className="font-medium">{key}</div>
                    <div className="text-sm text-muted-foreground">{description}</div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="listing-flag-content">Description *</Label>
            <Textarea
              id="listing-flag-content"
              placeholder="Please provide details about why you're flagging this listing..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">{content.length}/500 characters</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!reportType || !content.trim() || isFlagging}>
              {isFlagging ? 'Submitting...' : 'Submit Flag'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
