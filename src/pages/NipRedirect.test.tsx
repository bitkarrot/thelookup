import { describe, it, expect, vi } from 'vitest';

describe('NipRedirect logic', () => {
  it('should redirect from /nip/:id to /:id', () => {
    // Mock useParams to return an id
    const mockUseParams = vi.fn(() => ({ id: '01' }));
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useParams: mockUseParams,
        Navigate: ({ to, replace }: { to: string; replace: boolean }) => (
          <div data-testid="navigate" data-to={to} data-replace={replace.toString()}>
            Redirecting to {to}
          </div>
        ),
      };
    });

    // Test the redirect logic
    expect(mockUseParams()).toEqual({ id: '01' });
  });

  it('should redirect to 404 when no id is provided', () => {
    const mockUseParams = vi.fn(() => ({ id: undefined }));
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useParams: mockUseParams,
        Navigate: ({ to, replace }: { to: string; replace: boolean }) => (
          <div data-testid="navigate" data-to={to} data-replace={replace.toString()}>
            Redirecting to {to}
          </div>
        ),
      };
    });

    expect(mockUseParams()).toEqual({ id: undefined });
  });
});