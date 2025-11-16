import { useState, useEffect } from 'react';
import { parseFeaturedAppsMarkdown, type FeaturedApp } from '@/lib/parseFeaturedApps';

export function useFeaturedApps() {
  const [apps, setApps] = useState<FeaturedApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFeaturedApps() {
      try {
        setLoading(true);
        setError(null);
        
        // In browser/jsdom, construct an absolute URL so fetch works with undici.
        // In non-browser environments (e.g. Node without window), skip loading.
        if (typeof window === 'undefined') {
          setApps([]);
          setLoading(false);
          return;
        }

        const featuredAppsUrl = new URL('/FEATURED_APPS.md', window.location.origin).toString();

        // Fetch the FEATURED_APPS.md file from the public directory
        const response = await fetch(featuredAppsUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to load featured apps: ${response.status}`);
        }
        
        const markdownContent = await response.text();
        const parsedApps = parseFeaturedAppsMarkdown(markdownContent);
        
        setApps(parsedApps);
      } catch (err) {
        console.error('Error loading featured apps:', err);
        setError(err instanceof Error ? err.message : 'Failed to load featured apps');
        
        // Fallback to empty array if loading fails
        setApps([]);
      } finally {
        setLoading(false);
      }
    }

    loadFeaturedApps();
  }, []);

  return {
    apps,
    loading,
    error,
  };
}
