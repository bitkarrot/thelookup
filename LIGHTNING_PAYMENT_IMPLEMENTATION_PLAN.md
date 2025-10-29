# Comprehensive Plan: Lightning Payments for App Submissions

## Executive Summary

Based on analysis of the NostrHub codebase, this plan outlines the implementation of NIP-57 lightning payments for new app submissions. The implementation leverages existing zap infrastructure, adds minimal complexity to the current flow, and ensures a smooth user experience.

## Configuration Requirements

### Environment Variables (.env.example)
```env
# Lightning Payment Configuration for App Submissions
VITE_APP_SUBMISSION_PAYMENT_REQUIRED=true
VITE_APP_SUBSCRIPTION_LIGHTNING_ADDRESS=bitkarrot@primal.net
VITE_APP_SUBMISSION_FEE_SATS=100
VITE_APP_SUBMISSION_ZAP_RECEIPT_RELAY=wss://relay.primal.net
```

### Configuration Details
- **Lightning Address**: `bitkarrot@primal.net` (configurable)
- **Submission Fee**: 100 sats (configurable)
- **Zap Receipt Relay**: `wss://relay.primal.net` (configurable)
- **Network**: Bitcoin mainnet
- **Payment Verification**: NIP-57 zap receipts (kind 9735)

## Current Architecture Analysis

### Existing Payment Infrastructure
- **NIP-57 Implementation**: Robust support via `useZap.ts` and `useZapReceipts.ts`
- **Wallet Support**: WebLN and Nostr Wallet Connect (NWC) through `useWebLN.ts` and `useNWC.ts`
- **UI Components**: `ZapDialog.tsx` provides complete payment interface
- **Receipt Verification**: `useZapReceipts.ts` handles kind 9735 zap receipt events

### Current App Submission Flow
1. User visits `/apps/submit` → `SubmitAppPage.tsx` + `SubmitAppForm.tsx`
2. Form validation creates kind 31990 event with metadata and handlers
3. Event published via `useNostrPublish` hook
4. User redirected to app detail page using naddr encoding
5. Edit flow checks ownership: `app.pubkey === user.pubkey`

## Implementation Plan

### 1. Environment Configuration

**Updated .env.example**:
```env
# Site Configuration
VITE_SITE_NAME=nostrhub.io
VITE_SITE_URL=https://nostrhub.io
VITE_SITE_DISPLAY_NAME=NostrHub

# Lightning Payment Configuration for App Submissions
VITE_APP_SUBMISSION_PAYMENT_REQUIRED=true
VITE_APP_SUBSCRIPTION_LIGHTNING_ADDRESS=bitkarrot@primal.net
VITE_APP_SUBMISSION_FEE_SATS=100
VITE_APP_SUBMISSION_ZAP_RECEIPT_RELAY=wss://relay.primal.net

# Relay Configuration for App Ownership Claims
VITE_RELAY_NPUB=npub18pudjhdhhp2v8gxnkttt00um729nv93tuepjda2jrwn3eua5tf5s80a699
```

### 2. Core Payment Logic Components

#### A. New Hook: `useAppSubmissionPayment.ts`
```typescript
interface AppSubmissionPaymentState {
  invoice: string | null;
  isPolling: boolean;
  paymentStatus: 'pending' | 'paid' | 'timeout' | 'error';
  timeRemaining: number;
  zapReceipt: NostrEvent | null;
}

export function useAppSubmissionPayment() {
  // Generate lightning invoice for app submission fee
  // Poll for zap receipt verification every 10 seconds
  // 5-minute timeout with countdown timer
  // Integration with existing useZap infrastructure
}
```

#### B. New Component: `AppSubmissionPaymentDialog.tsx`
- Modal dialog overlaying the submission form
- Real-time payment status updates
- QR code and invoice display
- Countdown timer and polling status
- Payment success/cancellation handling

### 3. Enhanced App Submission Flow

#### Modified Flow:
1. User fills out app submission form
2. Click "Submit" → validation → **Payment Dialog Opens**
3. Lightning invoice generated for 100 sat submission fee
4. Polling begins for zap receipt (every 10s, 5min timeout)
5. **Payment Successful** → Publish kind 31990 event + redirect
6. **Payment Failed/Cancelled** → Show "payment canceled" + redirect to `/apps`

#### Integration Points:
- Modify `SubmitAppForm.tsx` to include payment dialog trigger
- Add payment state management during submission process
- Handle payment success/cancellation states appropriately

### 4. Zap Receipt Verification System

#### Key Implementation Details:
- Monitor kind 9735 events with `#p` tag pointing to submission fee address
- Verify payment amount matches required fee (100 sats)
- Extract payment hash and bolt11 invoice from zap receipt
- Use existing `useZapReceipts` pattern with custom filters

#### Verification Logic:
```typescript
// Query for zap receipts to the submission address
const zapReceiptFilter = {
  kinds: [9735],
  '#p': [submissionAddressPubkey],
  since: submissionStartTime,
  limit: 1
};

// Validate receipt amount matches 100 sats
const validateZapReceipt = (receipt: NostrEvent) => {
  const bolt11Tag = receipt.tags.find(tag => tag[0] === 'bolt11');
  const descriptionTag = receipt.tags.find(tag => tag[0] === 'description');

  if (!bolt11Tag || !descriptionTag) return false;

  const zapRequest = JSON.parse(descriptionTag[1]);
  const amountTag = zapRequest.tags.find(tag => tag[0] === 'amount');
  const amountMsats = parseInt(amountTag?.[1] || '0');

  return amountMsats === 100000; // 100 sats in msats
};
```

### 5. Edit Exemption System

#### Logic for Paid Submissions:
- Check if user already has a paid app submission in their history
- Query user's kind 31990 events for associated zap receipts
- If paid submission found, skip payment for subsequent edits
- Implement `useHasPaidForSubmission` hook for this check

#### Implementation:
```typescript
export function useHasPaidForSubmission(pubkey: string) {
  // Query user's kind 31990 events
  // Check for associated zap receipts (kind 9735)
  // Return true if valid payment found
}
```

### 6. Startup Validation Test

#### App Start Validation:
```typescript
// Check bitkarrot@primal.net NIP-57 support on app start
const validateSubmissionLightningAddress = async () => {
  try {
    // Resolve the lnurl to get pubkey
    const lnurlResponse = await fetch(`https://primal.net/.well-known/lnurlp/bitkarrot`);
    const { nostrPubkey } = await lnurlResponse.json();

    // Query profile and check zap endpoint
    const profile = await nostr.query([{ kinds: [0], authors: [nostrPubkey] }]);
    const zapEndpoint = await nip57.getZapEndpoint(profile[0]);

    if (!zapEndpoint) {
      console.error('bitkarrot@primal.net does not support NIP-57');
      return false;
    }

    // Test endpoint availability (without payment)
    const testResponse = await fetch(`${zapEndpoint}?amount=100000`); // 100 sats in msats
    return testResponse.ok;
  } catch (error) {
    console.error('Failed to validate bitkarrot@primal.net NIP-57 support:', error);
    return false;
  }
};
```

#### Integration:
- Add validation to `App.tsx` or main entry point
- Show warning if lightning address validation fails
- Allow app to function but disable payments if validation fails

### 7. Component Integration Points

#### Modified `SubmitAppForm.tsx`:
```typescript
// Add payment dialog trigger before event publishing
const onSubmit = async (data: AppFormData) => {
  if (!user) return;

  // Check if payment required and user hasn't paid
  if (paymentRequired && !hasPaid) {
    setShowPaymentDialog(true);
    return; // Wait for payment completion
  }

  // Original submission logic
  publishEvent({ kind: 31990, content, tags });
};
```

#### New `AppSubmissionPaymentDialog.tsx`:
- Reuse existing `ZapDialog` UI patterns
- Add polling status indicator ("Checking for payment... every 10 seconds")
- Implement countdown timer (5:00 → 0:00)
- Show payment verification progress

### 8. User Experience Flow

#### Payment Dialog States:
1. **Generating Invoice**: Show loading spinner
2. **Awaiting Payment**: Display QR code, invoice, polling status
   - Status message: "Checking for payment receipt every 10 seconds"
   - Countdown timer showing remaining time
3. **Payment Detected**: Show success animation
4. **Publishing App**: Show "Publishing to relay..." message
5. **Complete**: Redirect to app detail page

#### Error Handling:
- **Payment Timeout**: Show "Payment timed out" message + retry option
- **Payment Cancelled**: Show "Payment canceled" message + redirect to `/apps`
- **Network Issues**: Show error message + retry options

### 9. Technical Implementation Details

#### Payment Hook Structure:
```typescript
export function useAppSubmissionPayment() {
  const [state, setState] = useState<AppSubmissionPaymentState>({
    invoice: null,
    isPolling: false,
    paymentStatus: 'pending',
    timeRemaining: 300, // 5 minutes
    zapReceipt: null,
  });

  const generateInvoice = useCallback(async () => {
    // Use existing useZap infrastructure
    // Generate 100 sat invoice to bitkarrot@primal.net
  }, []);

  const startPolling = useCallback(() => {
    // Poll wss://relay.primal.net every 10 seconds
    // Check for kind 9735 zap receipts
    // Validate amount matches 100 sats
  }, []);

  const stopPolling = useCallback(() => {
    // Clean up polling intervals
  }, []);

  return { state, generateInvoice, startPolling, stopPolling };
}
```

#### Integration with Existing Infrastructure:
- Leverage existing `useNostrPublish` for final app submission
- Use existing `useZap` patterns for invoice generation
- Reuse `ZapDialog` UI components and patterns
- Follow existing error handling and toast notification patterns

### 10. Testing Strategy

#### Unit Tests:
- Payment hook functionality
- Zap receipt verification logic
- Form integration with payment flow

#### Integration Tests:
- End-to-end submission with payment
- Edit exemption logic
- Timeout and error handling

#### Manual Testing:
- Real lightning payments via mainnet (100 sats)
- QR code scanning and wallet flows
- Cross-platform compatibility

### 11. Security Considerations

#### Invoice Verification:
- Validate payment amount matches required fee (100 sats)
- Verify zap receipt authenticity
- Prevent duplicate submissions with same payment

#### Error Handling:
- Never publish app without successful payment verification
- Handle network interruptions gracefully
- Secure storage of payment state during process

### 12. File Structure for Implementation

#### New Files:
```
src/
├── hooks/
│   ├── useAppSubmissionPayment.ts
│   └── useHasPaidForSubmission.ts
├── components/
│   └── AppSubmissionPaymentDialog.tsx
└── lib/
    └── lightningPaymentConfig.ts
```

#### Modified Files:
```
src/
├── components/
│   └── SubmitAppForm.tsx
├── App.tsx (add startup validation)
└── .env.example
```

### 13. Deployment Considerations

#### Configuration Management:
- Environment-based payment requirement toggle
- Configurable fee amounts and relay targets
- Production vs. development lightning addresses

#### Monitoring:
- Track conversion rates (submission attempts vs. successful payments)
- Monitor payment failures and timeouts
- Alert on configuration issues

## Implementation Benefits

1. **Revenue Generation**: Creates sustainable funding mechanism for the platform
2. **Quality Control**: Payment requirement discourages spam/low-quality submissions
3. **User Experience**: Leverages existing, familiar zap payment flow
4. **Minimal Disruption**: Builds on existing infrastructure without major changes
5. **Editable Submissions**: Fair system allowing edits after initial payment
6. **Configurable**: Admins can adjust fees or disable payments as needed

## Implementation Priority

1. **Phase 1**: Environment configuration and startup validation
2. **Phase 2**: Payment hook and dialog component
3. **Phase 3**: Integration with submission form
4. **Phase 4**: Edit exemption logic
5. **Phase 5**: Testing and validation

## Next Steps

This plan provides a complete roadmap for implementing lightning payments while maintaining the excellent user experience and codebase quality already established in NostrHub. The implementation leverages existing patterns and infrastructure, ensuring a smooth and reliable integration.

Key features:
- 100 sat submission fee to `bitkarrot@primal.net`
- Zap receipt verification on `wss://relay.primal.net`
- 10-second polling intervals with 5-minute timeout
- Edit exemption for paid submissions
- Mainnet Bitcoin payments
- Configurable via environment variables