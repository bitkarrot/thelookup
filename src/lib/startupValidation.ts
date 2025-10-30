/**
 * Startup validation utilities
 * Performs validation checks when the app starts
 */

import { getLightningPaymentConfig, validateLightningPaymentConfig } from './lightningPaymentConfig';
import { getLnurlFromLightningAddress } from './lightningPaymentConfig';

export interface ValidationResult {
  success: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Validate lightning payment configuration on app startup
 */
export async function validateLightningPaymentSetup(): Promise<ValidationResult> {
  const config = getLightningPaymentConfig();
  const result: ValidationResult = {
    success: true,
    warnings: [],
    errors: [],
  };

  // Skip validation if payments are not required
  if (!config.paymentRequired) {
    result.warnings.push('Lightning payments are disabled');
    return result;
  }

  // Validate basic configuration
  const configValidation = validateLightningPaymentConfig(config);
  if (!configValidation.isValid) {
    result.success = false;
    result.errors.push(...configValidation.errors);
    return result;
  }

  // Test LNURL resolution
  try {
    const lnurlInfo = await getLnurlFromLightningAddress(config.lightningAddress);
    if (!lnurlInfo) {
      result.success = false;
      result.errors.push(`Could not resolve LNURL for ${config.lightningAddress}`);
      return result;
    }

    if (!lnurlInfo.nostrPubkey) {
      result.warnings.push(`Lightning address ${config.lightningAddress} may not support NIP-57 zaps - this could affect payment verification`);
    }

    // Test zap endpoint availability (without making actual payment)
    try {
      const testUrl = new URL(lnurlInfo.callback);
      testUrl.searchParams.set('amount', '100000'); // 100 sats in msats

      const response = await fetch(testUrl.toString(), { method: 'HEAD' });
      if (!response.ok) {
        result.warnings.push(`Zap endpoint returned status ${response.status}`);
      }
    } catch (error) {
      result.warnings.push(`Could not reach zap endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

  } catch (error) {
    result.success = false;
    result.errors.push(`Failed to validate lightning address: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Run all startup validations
 */
export async function runStartupValidations(): Promise<ValidationResult> {
  const results: ValidationResult[] = [];

  // Validate lightning payment setup
  const lightningValidation = await validateLightningPaymentSetup();
  results.push(lightningValidation);

  // Combine all results
  const combined: ValidationResult = {
    success: results.every(r => r.success),
    warnings: results.flatMap(r => r.warnings),
    errors: results.flatMap(r => r.errors),
  };

  return combined;
}

/**
 * Log validation results to console
 */
export function logValidationResults(result: ValidationResult): void {
  if (result.errors.length > 0) {
    console.error('❌ Startup validation failed:');
    result.errors.forEach(error => console.error(`  - ${error}`));
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️ Startup validation warnings:');
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  if (result.success && result.errors.length === 0 && result.warnings.length === 0) {
    console.log('✅ All startup validations passed');
  } else if (result.success && result.errors.length === 0) {
    console.log('✅ Startup validation completed with warnings');
  }
}