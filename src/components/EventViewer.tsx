import { useState } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { nip19 } from 'nostr-tools';
import { useAppConfig } from '@/components/AppProvider';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppsByKind } from '@/hooks/useApps';
import { Separator } from '@/components/ui/separator';


// Import specific event renderers
import { TextNoteRenderer } from './event-renderers/TextNoteRenderer';
import { UserMetadataRenderer } from './event-renderers/UserMetadataRenderer';
import { ReactionRenderer } from './event-renderers/ReactionRenderer';
import { RepostRenderer } from './event-renderers/RepostRenderer';
import { LongFormContentRenderer } from './event-renderers/LongFormContentRenderer';
import { CalendarEventRenderer } from './event-renderers/CalendarEventRenderer';
import { ChannelMessageRenderer } from './event-renderers/ChannelMessageRenderer';
import { FileMetadataRenderer } from './event-renderers/FileMetadataRenderer';

interface EventViewerProps {
  event: NostrEvent;
  className?: string;
}

export function EventViewer({ event, className }: EventViewerProps) {
  const [showRawData, setShowRawData] = useState(false);
  const { toast } = useToast();
  const author = useAuthor(event.pubkey);
  const { data: supportedApps, isLoading: isLoadingApps } = useAppsByKind(event.kind);
  const { config } = useAppConfig();

  const handleCopyEventId = () => {
    const nevent = nip19.neventEncode({
      id: event.id,
      author: event.pubkey,
    });
    navigator.clipboard.writeText(nevent);
    toast({ title: 'Event ID copied to clipboard' });
  };

  const handleCopyRawData = () => {
    navigator.clipboard.writeText(JSON.stringify(event, null, 2));
    toast({ title: 'Raw event data copied to clipboard' });
  };

  const handleOpenWithApp = (appWebHandler: string) => {
    // Generate the appropriate NIP-19 identifier for this event
    let nip19Id: string;

    // For addressable events (30000-39999), use naddr
    if (event.kind >= 30000 && event.kind < 40000) {
      const dTag = event.tags.find(([name]) => name === 'd')?.[1];
      if (dTag) {
        nip19Id = nip19.naddrEncode({
          identifier: dTag,
          pubkey: event.pubkey,
          kind: event.kind,
          relays: [config.relayUrl],
        });
      } else {
        // Fallback to nevent if no d tag found
        nip19Id = nip19.neventEncode({
          id: event.id,
          author: event.pubkey,
        });
      }
    } else {
      // For regular and replaceable events, use nevent
      nip19Id = nip19.neventEncode({
        id: event.id,
        author: event.pubkey,
      });
    }

    // Replace <bech32> placeholder with the actual NIP-19 identifier
    const url = appWebHandler.replace('<bech32>', nip19Id);
    window.open(url, '_blank');
  };

  // Get kind-specific renderer
  const renderEventContent = () => {
    switch (event.kind) {
      case 0:
        return <UserMetadataRenderer event={event} />;
      case 1:
      case 11:
      case 1111:
        return <TextNoteRenderer event={event} />;
      case 6:
      case 16:
        return <RepostRenderer event={event} />;
      case 7:
        return <ReactionRenderer event={event} />;
      case 42:
        return <ChannelMessageRenderer event={event} />;
      case 1063:
        return <FileMetadataRenderer event={event} />;
      case 30023:
      case 30024:
        return <LongFormContentRenderer event={event} />;
      case 31922:
      case 31923:
        return <CalendarEventRenderer event={event} />;
      default:
        // Fallback to JSON for unsupported kinds
        return (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              This event kind ({event.kind}) is not yet supported by the event viewer.
              Showing raw JSON data:
            </div>
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96">
              {JSON.stringify(event, null, 2)}
            </pre>
          </div>
        );
    }
  };

  const getKindDescription = (kind: number): string => {
    const kindDescriptions: Record<number, string> = {
      0: 'User Metadata',
      1: 'Short Text Note',
      3: 'Follows',
      4: 'Encrypted Direct Messages',
      5: 'Event Deletion Request',
      6: 'Repost',
      7: 'Reaction',
      8: 'Badge Award',
      9: 'Chat Message',
      11: 'Thread',
      14: 'Direct Message',
      16: 'Generic Repost',
      20: 'Picture',
      21: 'Video Event',
      40: 'Channel Creation',
      41: 'Channel Metadata',
      42: 'Channel Message',
      1063: 'File Metadata',
      1111: 'Comment',
      1984: 'Reporting',
      9735: 'Zap',
      10002: 'Relay List Metadata',
      30023: 'Long-form Content',
      30024: 'Draft Long-form Content',
      30402: 'Classified Listing',
      31922: 'Date-Based Calendar Event',
      31923: 'Time-Based Calendar Event',
    };
    return kindDescriptions[kind] || `Kind ${kind}`;
  };

  const displayName = author.data?.metadata?.name ?? genUserName(event.pubkey);
  const profileImage = author.data?.metadata?.picture;

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profileImage} alt={displayName} />
              <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{displayName}</CardTitle>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Badge variant="secondary">
                  {getKindDescription(event.kind)}
                </Badge>
                <span>•</span>
                <span>{new Date(event.created_at * 1000).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyEventId}
              className="h-8 w-8 p-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`https://njump.me/${nip19.neventEncode({ id: event.id, author: event.pubkey })}`, '_blank')}
              className="h-8 w-8 p-0"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {renderEventContent()}

        {/* Supported Applications Section */}
        {supportedApps && supportedApps.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                Open with Application
              </h4>
              <div className="grid gap-2">
                {supportedApps.map((app) => {
                  // Find the first web handler for this app
                  const webHandler = app.webHandlers.find(handler => handler.url);

                  if (!webHandler) return null;

                  return (
                    <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {app.picture && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={app.picture} alt={app.name || app.dTag} />
                            <AvatarFallback>
                              {(app.name || app.dTag).slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          <div className="font-medium text-sm">
                            {app.name || app.dTag}
                          </div>
                          {app.about && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {app.about}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenWithApp(webHandler.url)}
                        className="shrink-0"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open with {app.name || app.dTag}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Loading state for apps */}
        {isLoadingApps && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                Open with Application
              </h4>
              <div className="text-sm text-muted-foreground">
                Loading supported applications...
              </div>
            </div>
          </>
        )}

        <Collapsible open={showRawData} onOpenChange={setShowRawData}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span>Raw Event Data</span>
              {showRawData ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2">
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyRawData}
                className="h-8"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy JSON
              </Button>
            </div>
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96">
              {JSON.stringify(event, null, 2)}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}