import { ZapButton } from '@/components/ZapButton';
import { ZapReceipts } from '@/components/ZapReceipts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { NostrEvent } from '@/types/nostr';

interface ZapCustomNipProps {
  event: NostrEvent;
  className?: string;
}

export function ZapCustomNip({ event, className }: ZapCustomNipProps) {
  const dTag = event.tags.find((tag: string[]) => tag[0] === 'd')?.[1] || '';
  
  // Create event coordinate for addressable events
  const eventCoordinate = `${event.kind}:${event.pubkey}:${dTag}`;
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Support this NIP</CardTitle>
          <ZapButton
            recipientPubkey={event.pubkey}
            eventId={event.id}
            eventCoordinate={eventCoordinate}
            variant="default"
            size="sm"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Send lightning zaps to support the author of this custom NIP. Zaps help incentivize 
          quality contributions to the Nostr ecosystem.
        </p>
        
        <Separator />
        
        <div className="max-h-[100px] overflow-y-auto pr-1">
          <ZapReceipts
            eventId={event.id}
            eventCoordinate={eventCoordinate}
            maxDisplay={10}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Compact version for use in cards
export function ZapCustomNipCompact({ event }: { event: NostrEvent }) {
  const dTag = event.tags.find((tag: string[]) => tag[0] === 'd')?.[1] || '';
  const eventCoordinate = `${event.kind}:${event.pubkey}:${dTag}`;
  
  return (
    <div className="flex items-center gap-2">
      <ZapButton
        recipientPubkey={event.pubkey}
        eventId={event.id}
        eventCoordinate={eventCoordinate}
        variant="ghost"
        size="icon"
        showLabel={false}
      />
    </div>
  );
}