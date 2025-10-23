import { NostrEvent } from '@nostrify/nostrify';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCallback } from 'react';
import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import { CodeBlock } from '@/components/CodeBlock';

// Register JSON language for syntax highlighting
hljs.registerLanguage('json', json);

interface EventSourceDialogProps {
  event: NostrEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventSourceDialog({ event, open, onOpenChange }: EventSourceDialogProps) {
  const jsonString = JSON.stringify(event, null, 2);

  // Callback ref to ensure highlighting happens after the element is mounted
  const setCodeRef = useCallback((node: HTMLElement | null) => {
    if (node && open) {
      // Clear any existing highlighting and apply new highlighting
      node.removeAttribute('data-highlighted');
      hljs.highlightElement(node);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Event Source</DialogTitle>
          <DialogDescription>
            View the raw JSON data for this Nostr event.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-auto">
          <CodeBlock className="text-xs bg-muted p-4 rounded-md overflow-auto">
            <code ref={setCodeRef} className="language-json whitespace-pre">
              {jsonString}
            </code>
          </CodeBlock>
        </div>
      </DialogContent>
    </Dialog>
  );
}