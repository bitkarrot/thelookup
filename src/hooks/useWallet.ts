import { useState, useEffect } from 'react';
import { useNWC } from '@/hooks/useNWCContext';
import type { WebLNProvider } from '@webbtc/webln-types';

export function useWallet() {
  const [webln, setWebln] = useState<WebLNProvider | null>(null);
  const { getActiveConnection, activeConnection } = useNWC();

  useEffect(() => {
    // Check for WebLN provider
    if (typeof window !== 'undefined' && 'webln' in window) {
      setWebln((window as { webln?: WebLNProvider }).webln || null);
    }
  }, []);

  return {
    webln,
    activeNWC: activeConnection,
    getActiveConnection,
  };
}