import type { NostrEvent } from '@nostrify/nostrify';
import { NoteContent } from '@/components/NoteContent';

interface TextNoteRendererProps {
  event: NostrEvent;
}

export function TextNoteRenderer({ event }: TextNoteRendererProps) {
  const subjectTag = event.tags.find(([name]) => name === 'subject')?.[1];

  return (
    <div className="space-y-3">
      {subjectTag && (
        <div className="font-semibold text-lg">{subjectTag}</div>
      )}
      <div className="whitespace-pre-wrap break-words">
        <NoteContent event={event} />
      </div>
      {event.tags.filter(([name]) => name === 't').length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {event.tags
            .filter(([name]) => name === 't')
            .map(([, hashtag], index) => (
              <span
                key={index}
                className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground"
              >
                #{hashtag}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}