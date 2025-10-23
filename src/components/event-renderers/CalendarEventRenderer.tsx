import type { NostrEvent } from '@nostrify/nostrify';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, Tag } from 'lucide-react';

interface CalendarEventRendererProps {
  event: NostrEvent;
}

export function CalendarEventRenderer({ event }: CalendarEventRendererProps) {
  const titleTag = event.tags.find(([name]) => name === 'title')?.[1];
  const summaryTag = event.tags.find(([name]) => name === 'summary')?.[1];
  const startTag = event.tags.find(([name]) => name === 'start')?.[1];
  const endTag = event.tags.find(([name]) => name === 'end')?.[1];
  const locationTag = event.tags.find(([name]) => name === 'location')?.[1];
  const imageTag = event.tags.find(([name]) => name === 'image')?.[1];
  const dTag = event.tags.find(([name]) => name === 'd')?.[1];
  const hashtags = event.tags.filter(([name]) => name === 't').map(([, tag]) => tag);
  const participants = event.tags.filter(([name]) => name === 'p');
  
  const isDateBased = event.kind === 31922;

  const formatDateTime = (timestamp: string) => {
    if (isDateBased) {
      // Date format: YYYY-MM-DD
      return new Date(timestamp + 'T00:00:00').toLocaleDateString();
    } else {
      // Unix timestamp
      return new Date(parseInt(timestamp) * 1000).toLocaleString();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Badge variant="default">
            {isDateBased ? 'Date-Based Event' : 'Time-Based Event'}
          </Badge>
          {dTag && (
            <Badge variant="outline" className="text-xs font-mono">
              {dTag}
            </Badge>
          )}
        </div>

        {titleTag && (
          <h1 className="text-2xl font-bold leading-tight">{titleTag}</h1>
        )}

        {summaryTag && (
          <p className="text-muted-foreground leading-relaxed">
            {summaryTag}
          </p>
        )}
      </div>

      {/* Event Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {startTag && (
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Starts</div>
              <div className="text-sm text-muted-foreground">
                {formatDateTime(startTag)}
              </div>
            </div>
          </div>
        )}

        {endTag && (
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Ends</div>
              <div className="text-sm text-muted-foreground">
                {formatDateTime(endTag)}
              </div>
            </div>
          </div>
        )}

        {locationTag && (
          <div className="flex items-center space-x-2 md:col-span-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Location</div>
              <div className="text-sm text-muted-foreground">{locationTag}</div>
            </div>
          </div>
        )}

        {participants.length > 0 && (
          <div className="flex items-start space-x-2 md:col-span-2">
            <Users className="h-4 w-4 text-muted-foreground mt-1" />
            <div>
              <div className="text-sm font-medium">Participants</div>
              <div className="text-sm text-muted-foreground">
                {participants.length} participant{participants.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Featured Image */}
      {imageTag && (
        <div className="rounded-lg overflow-hidden">
          <img
            src={imageTag}
            alt={titleTag || 'Event image'}
            className="w-full h-48 object-cover"
          />
        </div>
      )}

      {/* Description */}
      {event.content && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Description</h3>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
            {event.content}
          </div>
        </div>
      )}

      {/* Tags */}
      {hashtags.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {hashtags.map((hashtag, index) => (
              <div key={index} className="flex items-center space-x-1">
                <Tag className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                  {hashtag}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}