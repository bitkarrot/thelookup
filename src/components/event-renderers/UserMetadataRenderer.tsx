import type { NostrEvent, NostrMetadata } from '@nostrify/nostrify';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Globe, Zap } from 'lucide-react';

interface UserMetadataRendererProps {
  event: NostrEvent;
}

export function UserMetadataRenderer({ event }: UserMetadataRendererProps) {
  let metadata: NostrMetadata;
  
  try {
    metadata = JSON.parse(event.content);
  } catch {
    return (
      <div className="text-sm text-muted-foreground">
        Invalid metadata format
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start space-x-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={metadata.picture} alt={metadata.name || 'User'} />
          <AvatarFallback>
            {(metadata.name || metadata.display_name || 'U').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <div>
            {metadata.display_name && (
              <h3 className="text-xl font-bold">{metadata.display_name}</h3>
            )}
            {metadata.name && (
              <p className="text-muted-foreground">@{metadata.name}</p>
            )}
          </div>
          
          {metadata.about && (
            <p className="text-sm whitespace-pre-wrap break-words">
              {metadata.about}
            </p>
          )}
          
          <div className="flex flex-wrap gap-2">
            {metadata.bot && (
              <Badge variant="secondary">
                🤖 Bot
              </Badge>
            )}
            
            {metadata.nip05 && (
              <Badge variant="outline" className="text-xs">
                ✓ {metadata.nip05}
              </Badge>
            )}
            
            {(metadata.lud06 || metadata.lud16) && (
              <Badge variant="outline" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Lightning
              </Badge>
            )}
          </div>
          
          {metadata.website && (
            <a
              href={metadata.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <Globe className="h-4 w-4 mr-1" />
              {metadata.website}
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          )}
        </div>
      </div>
      
      {metadata.banner && (
        <div className="rounded-lg overflow-hidden">
          <img
            src={metadata.banner}
            alt="Profile banner"
            className="w-full h-32 object-cover"
          />
        </div>
      )}
    </div>
  );
}