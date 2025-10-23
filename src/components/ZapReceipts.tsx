import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap } from 'lucide-react';
import { useZapReceipts } from '@/hooks/useZapReceipts';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { cn } from '@/lib/utils';

interface ZapReceiptsProps {
  eventId?: string;
  pubkey?: string;
  eventCoordinate?: string;
  className?: string;
  showTotal?: boolean;
  maxDisplay?: number;
}

interface ZapReceiptItemProps {
  zapReceipt: {
    event: {
      id: string;
      pubkey: string;
      created_at: number;
      kind: number;
      tags: string[][];
      content: string;
      sig: string;
    };
    amount: number;
    sender?: string;
    comment?: string;
    bolt11: string;
    zapRequest: {
      id: string;
      pubkey: string;
      created_at: number;
      kind: number;
      tags: string[][];
      content: string;
      sig: string;
    };
  };
}

function ZapReceiptItem({ zapReceipt }: ZapReceiptItemProps) {
  const author = useAuthor(zapReceipt.sender || '');
  const metadata = author.data?.metadata;
  
  const displayName = metadata?.name ?? genUserName(zapReceipt.sender || '');
  const profileImage = metadata?.picture;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
      <Avatar className="h-8 w-8">
        <AvatarImage src={profileImage} alt={displayName} />
        <AvatarFallback className="text-xs">
          {displayName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{displayName}</span>
          <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
            <Zap className="h-3 w-3 fill-current" />
            <span className="font-bold text-sm">{zapReceipt.amount.toLocaleString()}</span>
          </div>
        </div>
        {zapReceipt.comment && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {zapReceipt.comment}
          </p>
        )}
      </div>
    </div>
  );
}

function ZapReceiptSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

export function ZapReceipts({
  eventId,
  pubkey,
  className,
  showTotal = true,
  maxDisplay = 5,
}: ZapReceiptsProps) {
  const { data: zapReceipts, isLoading, error } = useZapReceipts({
    eventId,
    pubkey,
  });

  if (error) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {showTotal && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
        )}
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <ZapReceiptSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!zapReceipts || zapReceipts.length === 0) {
    return null;
  }

  const totalAmount = zapReceipts.reduce((sum, zap) => sum + zap.amount, 0);
  const displayedZaps = zapReceipts.slice(0, maxDisplay);
  const remainingCount = zapReceipts.length - maxDisplay;

  return (
    <div className={cn('space-y-3', className)}>
      {showTotal && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Zap className="h-4 w-4 text-orange-500" />
          <span>
            {totalAmount.toLocaleString()} sats from {zapReceipts.length} zap{zapReceipts.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
      
      <div className="space-y-2">
        {displayedZaps.map((zapReceipt, index) => (
          <ZapReceiptItem key={zapReceipt.event.id || index} zapReceipt={zapReceipt} />
        ))}
        
        {remainingCount > 0 && (
          <div className="text-center py-2">
            <span className="text-sm text-muted-foreground">
              +{remainingCount} more zap{remainingCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ZapReceiptsCard(props: ZapReceiptsProps) {
  return (
    <Card className={props.className}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-orange-500" />
          <h3 className="font-semibold">Lightning Zaps</h3>
        </div>
      </CardHeader>
      <CardContent>
        <ZapReceipts {...props} showTotal={false} />
      </CardContent>
    </Card>
  );
}