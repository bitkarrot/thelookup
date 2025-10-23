import { useMutation } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useWebLN } from '@/hooks/useWebLN';
import { useToast } from '@/hooks/useToast';
import { nip57 } from 'nostr-tools';

interface ZapRequest {
  recipientPubkey: string;
  amount: number; // in sats
  comment?: string;
  eventId?: string; // for zapping events
  eventCoordinate?: string; // for zapping addressable events (naddr)
  relays?: string[];
}



export function useZap() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { sendPayment, enable: enableWebLN, isAvailable: isWebLNAvailable } = useWebLN();
  const { toast } = useToast();

  const zapMutation = useMutation({
    mutationFn: async (zapRequest: ZapRequest) => {
      if (!user) {
        throw new Error('You must be logged in to send zaps');
      }

      if (!isWebLNAvailable) {
        throw new Error('WebLN is not available. Please install a WebLN-compatible wallet extension.');
      }

      const { recipientPubkey, amount, comment = '', eventId, eventCoordinate, relays = ['wss://relay.nostr.band'] } = zapRequest;

      // Get recipient's profile to find their lightning address
      const recipientProfile = await nostr.query([{ kinds: [0], authors: [recipientPubkey], limit: 1 }]);
      
      if (recipientProfile.length === 0) {
        throw new Error('Recipient profile not found');
      }

      // Get zap endpoint using nip57
      const zapEndpoint = await nip57.getZapEndpoint(recipientProfile[0]);
      
      if (!zapEndpoint) {
        throw new Error('Recipient does not support zaps');
      }

      const amountMsats = amount * 1000;

      // Create zap request using nip57
      const zapRequestParams = {
        profile: recipientPubkey,
        amount: amountMsats,
        comment,
        relays,
        event: eventId || null,
      };

      const zapRequestEvent = nip57.makeZapRequest(zapRequestParams);

      // Handle addressable events (eventCoordinate) manually since nip57 expects event object
      if (eventCoordinate) {
        zapRequestEvent.tags.push(['a', eventCoordinate]);
      }

      // Sign the zap request
      const signedZapRequest = await user.signer.signEvent(zapRequestEvent);

      // Send zap request to get invoice
      const zapEndpointUrl = new URL(zapEndpoint);
      zapEndpointUrl.searchParams.set('amount', amountMsats.toString());
      zapEndpointUrl.searchParams.set('nostr', encodeURIComponent(JSON.stringify(signedZapRequest)));

      const invoiceResponse = await fetch(zapEndpointUrl.toString());
      if (!invoiceResponse.ok) {
        throw new Error('Failed to get invoice from recipient');
      }

      const invoiceData = await invoiceResponse.json();
      if (!invoiceData.pr) {
        throw new Error('No invoice received from recipient');
      }

      // Enable WebLN if not already enabled
      try {
        await enableWebLN();
      } catch {
        throw new Error('Failed to enable WebLN wallet');
      }

      // Pay the invoice using WebLN
      const paymentResult = await sendPayment(invoiceData.pr);

      return {
        zapRequest: signedZapRequest,
        invoice: invoiceData.pr,
        preimage: paymentResult.preimage,
        paymentHash: paymentResult.paymentHash,
      };
    },
    onSuccess: (data) => {
      toast({
        title: 'Zap sent successfully!',
        description: `Payment completed with preimage: ${data.preimage.slice(0, 16)}...`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Zap failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    sendZap: zapMutation.mutate,
    sendZapAsync: zapMutation.mutateAsync,
    isLoading: zapMutation.isPending,
    error: zapMutation.error,
    isWebLNAvailable,
  };
}