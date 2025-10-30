import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getLightningPaymentConfig } from '@/lib/lightningPaymentConfig';
import { getLnurlFromLightningAddress } from '@/lib/lightningPaymentConfig';

/**
 * Check if a user has already paid for an app submission
 * This allows users to edit their apps without paying again
 */
export function useHasPaidForSubmission() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const config = getLightningPaymentConfig();

  return useQuery({
    queryKey: ['hasPaidForSubmission', user?.pubkey],
    queryFn: async ({ signal }) => {
      if (!user || !config.paymentRequired) {
        return { hasPaid: false, reason: 'user_not_logged_in' };
      }

      try {
        // Get user's app submissions (kind 31990 events)
        const appEvents = await nostr.query([{
          kinds: [31990],
          authors: [user.pubkey],
          limit: 50,
        }], { signal });

        if (appEvents.length === 0) {
          return { hasPaid: false, reason: 'no_app_submissions' };
        }

        // Get LNURL info to find the recipient pubkey
        const lnurlInfo = await getLnurlFromLightningAddress(config.lightningAddress);
        if (!lnurlInfo?.nostrPubkey) {
          console.warn('Could not get nostr pubkey from lightning address');
          return { hasPaid: false, reason: 'lightning_address_error' };
        }

        // Check for zap receipts related to these app submissions
        const appSubmissionTimes = appEvents.map(event => event.created_at);
        const earliestSubmissionTime = Math.min(...appSubmissionTimes);

        // Look for zap receipts to the payment address after the earliest app submission
        const zapReceipts = await nostr.query([{
          kinds: [9735], // Zap receipts
          '#p': [lnurlInfo.nostrPubkey],
          since: earliestSubmissionTime - 3600, // Look back 1 hour before first submission
          limit: 100,
        }], { signal });

        if (zapReceipts.length === 0) {
          return { hasPaid: false, reason: 'no_zap_receipts' };
        }

        // Validate zap receipts to find one that matches the fee amount
        const expectedMsats = config.feeSats * 1000;

        for (const receipt of zapReceipts) {
          try {
            const descriptionTag = receipt.tags.find(tag => tag[0] === 'description');
            if (!descriptionTag) continue;

            const zapRequestJson = descriptionTag[1];
            let zapRequest;

            try {
              zapRequest = JSON.parse(zapRequestJson);
            } catch {
              continue;
            }

            // Validate zap request
            if (zapRequest.kind !== 9734) continue;

            // Check if this zap request is from our user
            if (zapRequest.pubkey !== user.pubkey) continue;

            // Check amount matches expected fee
            const amountTag = zapRequest.tags.find(tag => tag[0] === 'amount');
            const amountMsats = parseInt(amountTag?.[1] || '0');

            if (amountMsats === expectedMsats) {
              return {
                hasPaid: true,
                reason: 'valid_payment_found',
                zapReceipt: receipt,
                appEvents,
              };
            }
          } catch (error) {
            console.error('Error validating zap receipt:', error);
            continue;
          }
        }

        return { hasPaid: false, reason: 'no_valid_payment', zapReceipts, appEvents };

      } catch (error) {
        console.error('Error checking payment status:', error);
        return { hasPaid: false, reason: 'error', error };
      }
    },
    enabled: !!(user && config.paymentRequired),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

/**
 * Check if a specific app edit should require payment
 */
export function useShouldRequirePaymentForEdit(appEventId?: string) {
  const { data: paymentStatus } = useHasPaidForSubmission();

  return {
    shouldRequirePayment: !paymentStatus?.hasPaid,
    reason: paymentStatus?.reason,
    hasPaid: paymentStatus?.hasPaid || false,
  };
}