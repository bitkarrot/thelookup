import { useState, useEffect, useRef, forwardRef } from 'react';
import { Zap, Copy, Check, ExternalLink, Clock, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/useToast';
import { useAppSubmissionPayment } from '@/hooks/useAppSubmissionPayment';
import { formatFeeAmount } from '@/lib/lightningPaymentConfig';
import QRCode from 'qrcode';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AppSubmissionPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentSuccess: () => void;
  onPaymentCancelled: () => void;
}

const PaymentContent = forwardRef<HTMLDivElement, {
  state: ReturnType<typeof useAppSubmissionPayment>['state'];
  config: ReturnType<typeof useAppSubmissionPayment>['config'];
  qrCodeUrl: string;
  copied: boolean;
  onCopy: () => void;
  onOpenInWallet: () => void;
  onRetry: () => void;
  onCancel: () => void;
}>(({ state, config, qrCodeUrl, copied, onCopy, onOpenInWallet, onRetry, onCancel }, ref) => {
  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = ((config.paymentTimeoutSeconds - state.timeRemaining) / config.paymentTimeoutSeconds) * 100;

  if (state.paymentStatus === 'generating') {
    return (
      <div ref={ref} className="flex flex-col items-center justify-center py-12 px-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h3 className="text-lg font-semibold mb-2">Generating Invoice</h3>
        <p className="text-muted-foreground text-center">
          Creating your lightning invoice for app submission...
        </p>
      </div>
    );
  }

  if (state.paymentStatus === 'paid') {
    return (
      <div ref={ref} className="flex flex-col items-center justify-center py-12 px-8">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Payment Received!</h3>
        <p className="text-muted-foreground text-center">
          Your payment of {formatFeeAmount(config.feeSats)} sats has been confirmed.
        </p>
        <p className="text-muted-foreground text-center text-sm mt-2">
          Your app submission will now be published to the relay.
        </p>
      </div>
    );
  }

  if (state.paymentStatus === 'timeout') {
    return (
      <div ref={ref} className="flex flex-col items-center justify-center py-12 px-8">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <Clock className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Payment Timeout</h3>
        <p className="text-muted-foreground text-center mb-4">
          {state.error || 'The payment window has expired.'}
        </p>
        <div className="flex gap-2">
          <Button onClick={onRetry} variant="default">
            Try Again
          </Button>
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (state.paymentStatus === 'error') {
    return (
      <div ref={ref} className="flex flex-col items-center justify-center py-12 px-8">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <X className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Payment Error</h3>
        <p className="text-muted-foreground text-center mb-4">
          {state.error || 'An error occurred while processing your payment.'}
        </p>
        <div className="flex gap-2">
          <Button onClick={onRetry} variant="default">
            Try Again
          </Button>
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="flex flex-col h-full min-h-0">
      {/* Payment amount display */}
      <div className="text-center pt-4">
        <div className="text-2xl font-bold">{formatFeeAmount(config.feeSats)} sats</div>
        <p className="text-sm text-muted-foreground mt-1">
          App submission fee
        </p>
      </div>

      {/* Payment status and countdown */}
      <div className="px-4 py-3 bg-muted/50 rounded-lg mx-4 mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {state.isPolling ? 'Checking for payment...' : 'Awaiting payment'}
          </span>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            <span className={state.timeRemaining < 60 ? 'text-red-600 font-medium' : ''}>
              {formatTimeRemaining(state.timeRemaining)}
            </span>
          </div>
        </div>
        <Progress value={progressPercentage} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">
          Checking for payment receipt every 10 seconds
        </p>
      </div>

      {/* QR Code and Invoice */}
      {state.invoice ? (
        <div className="flex flex-col justify-center min-h-0 flex-1 px-4 py-4">
          {/* QR Code */}
          <div className="flex justify-center mb-4">
            <Card className="p-3 max-w-[280px] mx-auto">
              <CardContent className="p-0 flex justify-center">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="Lightning Invoice QR Code"
                    className="w-full h-auto aspect-square object-contain"
                  />
                ) : (
                  <div className="w-full aspect-square bg-muted animate-pulse rounded" />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Invoice input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Lightning Invoice</label>
            <div className="flex gap-2">
              <input
                value={state.invoice}
                readOnly
                className="flex-1 px-3 py-2 text-sm bg-muted border rounded-md font-mono"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={onCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Payment buttons */}
          <div className="space-y-3 mt-4">
            <Button
              onClick={onOpenInWallet}
              className="w-full"
              size="lg"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Lightning Wallet
            </Button>

            <Button
              variant="outline"
              onClick={onCancel}
              className="w-full"
            >
              Cancel Payment
            </Button>

            <div className="text-xs text-muted-foreground text-center">
              Scan the QR code or copy the invoice to pay with any Lightning wallet.
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-8">
          <p className="text-muted-foreground text-center">
            Generating your payment invoice...
          </p>
        </div>
      )}
    </div>
  );
});

PaymentContent.displayName = 'PaymentContent';

export function AppSubmissionPaymentDialog({
  open,
  onOpenChange,
  onPaymentSuccess,
  onPaymentCancelled,
}: AppSubmissionPaymentDialogProps) {
  const { state, config, generateInvoice, resetPaymentState } = useAppSubmissionPayment();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Generate QR code when invoice is available
  useEffect(() => {
    let isCancelled = false;

    const generateQR = async () => {
      if (!state.invoice) {
        setQrCodeUrl('');
        return;
      }

      try {
        const url = await QRCode.toDataURL(state.invoice.toUpperCase(), {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });

        if (!isCancelled) {
          setQrCodeUrl(url);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to generate QR code:', err);
        }
      }
    };

    generateQR();

    return () => {
      isCancelled = true;
    };
  }, [state.invoice]);

  // Handle payment success
  useEffect(() => {
    if (state.paymentStatus === 'paid') {
      setTimeout(() => {
        onPaymentSuccess();
        onOpenChange(false);
        resetPaymentState();
      }, 2000); // Show success message for 2 seconds
    }
  }, [state.paymentStatus, onPaymentSuccess, onOpenChange, resetPaymentState]);

  // Generate invoice when dialog opens
  useEffect(() => {
    if (open && state.paymentStatus === 'pending' && !state.invoice) {
      generateInvoice();
    }
  }, [open, state.paymentStatus, state.invoice, generateInvoice]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      resetPaymentState();
      setQrCodeUrl('');
      setCopied(false);
    }
  }, [open, resetPaymentState]);

  const handleCopy = async () => {
    if (state.invoice) {
      await navigator.clipboard.writeText(state.invoice);
      setCopied(true);
      toast({
        title: 'Invoice copied',
        description: 'Lightning invoice copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openInWallet = () => {
    if (state.invoice) {
      const lightningUrl = `lightning:${state.invoice}`;
      window.open(lightningUrl, '_blank');
    }
  };

  const handleRetry = () => {
    resetPaymentState();
    generateInvoice();
  };

  const handleCancel = () => {
    resetPaymentState();
    onPaymentCancelled();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-lg">App Submission Payment</DialogTitle>
          <DialogDescription className="text-center">
            Complete the payment to submit your app to The Lookup directory.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto">
          <PaymentContent
            state={state}
            config={config}
            qrCodeUrl={qrCodeUrl}
            copied={copied}
            onCopy={handleCopy}
            onOpenInWallet={openInWallet}
            onRetry={handleRetry}
            onCancel={handleCancel}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}