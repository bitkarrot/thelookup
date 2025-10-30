/**
 * Lightning Payment Configuration for App Submissions
 * Handles configuration and validation of lightning payment settings
 */

export interface LightningPaymentConfig {
  /** Whether payment is required for app submissions */
  paymentRequired: boolean;
  /** Lightning address for receiving payments */
  lightningAddress: string;
  /** Fee amount in satoshis */
  feeSats: number;
  /** Relay for monitoring zap receipts */
  zapReceiptRelay: string;
  /** Timeout for payment verification in seconds */
  paymentTimeoutSeconds: number;
  /** Polling interval for checking payment status in seconds */
  pollingIntervalSeconds: number;
}

/**
 * Get lightning payment configuration from environment variables
 */
export function getLightningPaymentConfig(): LightningPaymentConfig {
  return {
    paymentRequired: import.meta.env.VITE_APP_SUBMISSION_PAYMENT_REQUIRED === 'true',
    lightningAddress: import.meta.env.VITE_APP_SUBSCRIPTION_LIGHTNING_ADDRESS || '',
    feeSats: parseInt(import.meta.env.VITE_APP_SUBMISSION_FEE_SATS || '100'),
    zapReceiptRelay: import.meta.env.VITE_APP_SUBMISSION_ZAP_RECEIPT_RELAY || 'wss://relay.primal.net',
    paymentTimeoutSeconds: 300, // 5 minutes
    pollingIntervalSeconds: 10, // Check every 10 seconds
  };
}

/**
 * Validate lightning payment configuration
 */
export function validateLightningPaymentConfig(config: LightningPaymentConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (config.paymentRequired) {
    if (!config.lightningAddress) {
      errors.push('Lightning address is required when payments are enabled');
    }

    if (!config.lightningAddress.includes('@')) {
      errors.push('Invalid lightning address format');
    }

    if (config.feeSats <= 0) {
      errors.push('Fee amount must be greater than 0');
    }

    if (!config.zapReceiptRelay) {
      errors.push('Zap receipt relay is required');
    }

    if (!config.zapReceiptRelay.startsWith('wss://')) {
      errors.push('Zap receipt relay must be a WebSocket URL');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format fee amount for display
 */
export function formatFeeAmount(sats: number): string {
  return new Intl.NumberFormat().format(sats);
}

/**
 * Convert satoshis to milliseconds for lightning payments
 */
export function satsToMsats(sats: number): number {
  return sats * 1000;
}

/**
 * Get the LNURL for a lightning address
 */
export async function getLnurlFromLightningAddress(address: string): Promise<{
  nostrPubkey?: string;
  callback: string;
  tag: string;
} | null> {
  try {
    const [name, domain] = address.split('@');
    if (!name || !domain) return null;

    const response = await fetch(`https://${domain}/.well-known/lnurlp/${name}`);
    if (!response.ok) return null;

    const data = await response.json();
    return {
      nostrPubkey: data.nostrPubkey || data.allowsNostr && data.pubkey,
      callback: data.callback,
      tag: data.tag,
    };
  } catch (error) {
    console.error('Failed to resolve LNURL for lightning address:', address, error);
    return null;
  }
}