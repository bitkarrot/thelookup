/**
 * Site configuration utility
 * Returns site-specific values from environment variables with sensible defaults
 */

import { nip19 } from 'nostr-tools';

export function getSiteName(): string {
  return import.meta.env.VITE_SITE_NAME || 'The Lookup';
}

export function getSiteUrl(): string {
  return import.meta.env.VITE_SITE_URL || 'https://lookup.hivetalk.org';
}

export function getClientTag(): string | null {
  // Only return a client tag if VITE_SITE_NAME is explicitly set
  return import.meta.env.VITE_SITE_NAME || null;
}

export function getSiteDisplayName(): string {
  // Check if VITE_SITE_DISPLAY_NAME is set first
  if (import.meta.env.VITE_SITE_DISPLAY_NAME) {
    return import.meta.env.VITE_SITE_DISPLAY_NAME;
  }

  const siteName = getSiteName();
  // Convert domain name to display name (e.g., lookup.hivetalk.org -> HiveTalk)
  if (siteName.includes('.')) {
    const parts = siteName.split('.');
    const mainName = parts[0];
    // Capitalize and clean up the name
    return mainName.charAt(0).toUpperCase() + mainName.slice(1).replace(/[-_]/g, ' ');
  }
  return siteName.charAt(0).toUpperCase() + siteName.slice(1);
}

export function getSiteFullName(): string {
  const displayName = getSiteDisplayName();
  return displayName;
}

export function getPageTitle(pageTitle: string): string {
  const siteName = getSiteFullName();
  return `${pageTitle} | ${siteName}`;
}

export function getPageDescription(description: string): string {
  const siteName = getSiteFullName();
  return description.includes(siteName) ? description : `${description} on ${siteName}.`;
}

/**
 * Client-side curation configuration
 */
export function isClientSideCurationEnabled(): boolean {
  return import.meta.env.VITE_CLIENT_SIDE_CURATION === 'true';
}

export function getCuratorNpubs(): string[] {
  const npubsString = import.meta.env.VITE_NPUB_CURATORS;
  if (!npubsString || typeof npubsString !== 'string') {
    return [];
  }
  
  return npubsString
    .split(',')
    .map(npub => npub.trim())
    .filter(npub => npub.length > 0 && npub.startsWith('npub1'));
}

export function getCuratorPubkeys(): string[] {
  const npubs = getCuratorNpubs();
  const pubkeys: string[] = [];
  
  console.log('🔍 [DEBUG] getCuratorPubkeys - Input npubs:', npubs);
  
  for (const npub of npubs) {
    try {
      // Convert npub to hex pubkey using bech32 decoding
      // This is a simplified version - in production you'd use a proper bech32 library
      // For now, we'll assume the conversion happens elsewhere or use a utility
      const pubkey = convertNpubToPubkey(npub);
      if (pubkey) {
        pubkeys.push(pubkey);
        console.log(`🔍 [DEBUG] Converted ${npub} -> ${pubkey}`);
      } else {
        console.warn(`🔍 [DEBUG] Failed to convert npub: ${npub}`);
      }
    } catch (error) {
      console.warn(`Invalid npub in NPUB_CURATORS: ${npub}`, error);
    }
  }
  
  console.log('🔍 [DEBUG] getCuratorPubkeys - Final pubkeys:', pubkeys);
  return pubkeys;
}

// Convert npub to hex pubkey using nostr-tools
function convertNpubToPubkey(npub: string): string | null {
  try {
    const decoded = nip19.decode(npub);
    
    if (decoded.type === 'npub') {
      return decoded.data as string;
    }
    
    console.warn(`Invalid npub type: ${decoded.type}, expected 'npub'`);
    return null;
  } catch (error) {
    console.warn(`Failed to decode npub ${npub}:`, error);
    return null;
  }
}