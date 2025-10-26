import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Zap, Loader2 } from 'lucide-react';
import { useZap } from '@/hooks/useZap';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cn } from '@/lib/utils';

interface ZapButtonProps {
  recipientPubkey: string;
  eventId?: string;
  eventCoordinate?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

const PRESET_AMOUNTS = [21, 100, 500, 1000, 5000];

export function ZapButton({
  recipientPubkey,
  eventId,
  eventCoordinate,
  className,
  variant = 'outline',
  size = 'sm',
  showLabel = true,
}: ZapButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  const { user } = useCurrentUser();
  const { sendZap, isLoading, isWebLNAvailable } = useZap();

  const handlePresetClick = (presetAmount: number) => {
    setAmount(presetAmount.toString());
    setSelectedPreset(presetAmount);
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setSelectedPreset(null);
  };

  const handleZap = async () => {
    const amountNum = parseInt(amount);
    if (!amountNum || amountNum <= 0) {
      return;
    }

    try {
      await sendZap({
        recipientPubkey,
        amount: amountNum,
        comment,
        eventId,
        eventCoordinate,
      });
      
      // Reset form and close dialog
      setAmount('');
      setComment('');
      setSelectedPreset(null);
      setIsOpen(false);
    } catch {
      // Error is handled by the hook
    }
  };

  if (!user) {
    return null;
  }

  if (!isWebLNAvailable) {
    return (
      <Button
        variant={variant}
        size={size}
        className={cn('text-orange-500', className)}
        disabled
        title="WebLN wallet required for zaps. Install Alby, Zeus, or another WebLN-compatible wallet extension"
      >
        <Zap className="h-4 w-4" />
        {showLabel && size !== 'icon' && <span className="ml-1">Zap</span>}
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn('text-orange-500 hover:text-orange-600', className)}
        >
          <Zap className="h-4 w-4" />
          {showLabel && size !== 'icon' && <span className="ml-1">Zap</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            Send Lightning Zap
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount (sats)</Label>
            <div className="mt-2 space-y-2">
              <div className="flex gap-2 flex-wrap">
                {PRESET_AMOUNTS.map((preset) => (
                  <Button
                    key={preset}
                    variant={selectedPreset === preset ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePresetClick(preset)}
                    type="button"
                  >
                    {preset}
                  </Button>
                ))}
              </div>
              <Input
                id="amount"
                type="number"
                placeholder="Enter custom amount"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                min="1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="comment">Comment (optional)</Label>
            <Textarea
              id="comment"
              placeholder="Add a comment with your zap..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleZap}
              disabled={!amount || parseInt(amount) <= 0 || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Send {amount} sats
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}