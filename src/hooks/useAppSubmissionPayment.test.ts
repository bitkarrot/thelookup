import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAppSubmissionPayment } from './useAppSubmissionPayment';

// Mock environment variables
const mockEnv = {
  VITE_SUBMIT_APP_LIGHTNING_ADDRESS: '',
  VITE_SUBMIT_APP_FEE: '',
};

vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    user: {
      pubkey: 'test-pubkey',
      signer: {
        signEvent: vi.fn().mockResolvedValue({ id: 'signed-event' }),
      },
    },
  }),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@nostrify/react', () => ({
  useNostr: () => ({
    nostr: {
      query: vi.fn().mockResolvedValue([]),
    },
  }),
}));

describe('useAppSubmissionPayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    Object.keys(mockEnv).forEach(key => {
      vi.stubEnv(key, mockEnv[key as keyof typeof mockEnv]);
    });
  });

  it('should return payment not required when no lightning address is configured', () => {
    vi.stubEnv('VITE_SUBMIT_APP_LIGHTNING_ADDRESS', '');
    vi.stubEnv('VITE_SUBMIT_APP_FEE', '');

    const { result } = renderHook(() => useAppSubmissionPayment());

    expect(result.current.isPaymentRequired).toBe(false);
    expect(result.current.paymentConfig).toBe(null);
  });

  it('should return payment not required when fee is 0', () => {
    vi.stubEnv('VITE_SUBMIT_APP_LIGHTNING_ADDRESS', 'test@example.com');
    vi.stubEnv('VITE_SUBMIT_APP_FEE', '0');

    const { result } = renderHook(() => useAppSubmissionPayment());

    expect(result.current.isPaymentRequired).toBe(false);
    expect(result.current.paymentConfig).toBe(null);
  });

  it('should return payment required when both lightning address and fee are configured', () => {
    vi.stubEnv('VITE_SUBMIT_APP_LIGHTNING_ADDRESS', 'test@example.com');
    vi.stubEnv('VITE_SUBMIT_APP_FEE', '1000');

    const { result } = renderHook(() => useAppSubmissionPayment());

    expect(result.current.isPaymentRequired).toBe(true);
    expect(result.current.paymentConfig).toEqual({
      lightningAddress: 'test@example.com',
      feeAmount: 1000,
    });
  });

  it('should return payment not required when lightning address is missing', () => {
    vi.stubEnv('VITE_SUBMIT_APP_LIGHTNING_ADDRESS', '');
    vi.stubEnv('VITE_SUBMIT_APP_FEE', '1000');

    const { result } = renderHook(() => useAppSubmissionPayment());

    expect(result.current.isPaymentRequired).toBe(false);
    expect(result.current.paymentConfig).toBe(null);
  });

  it('should return payment not required when fee is invalid', () => {
    vi.stubEnv('VITE_SUBMIT_APP_LIGHTNING_ADDRESS', 'test@example.com');
    vi.stubEnv('VITE_SUBMIT_APP_FEE', 'invalid');

    const { result } = renderHook(() => useAppSubmissionPayment());

    expect(result.current.isPaymentRequired).toBe(false);
    expect(result.current.paymentConfig).toBe(null);
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useAppSubmissionPayment());

    expect(result.current.paymentState).toEqual({
      invoice: null,
      zapRequest: null,
      paid: false,
      verifying: false,
    });
    expect(result.current.isCreatingPayment).toBe(false);
    expect(result.current.isVerifyingPayment).toBe(false);
  });
});
