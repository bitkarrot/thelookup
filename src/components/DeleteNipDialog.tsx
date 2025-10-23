import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useDeleteNip } from '@/hooks/useDeleteNip';
import { NostrEvent } from '@/types/nostr';
import { useToast } from '@/hooks/useToast';

interface DeleteNipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: NostrEvent;
  title: string;
}

export function DeleteNipDialog({ open, onOpenChange, event, title }: DeleteNipDialogProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const { mutate: deleteNip, isPending } = useDeleteNip();

  const handleDelete = () => {
    deleteNip(
      { event, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          toast({
            title: 'Deletion request published',
          })
          onOpenChange(false);
          setReason('');
        },
        onError: (error) => {
          toast({
            title: 'Failed to publish deletion request',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete NIP</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{title}"? This will publish a deletion request (NIP-09) to the network.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-2">
          <Label htmlFor="reason">Reason (optional)</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Published by mistake, outdated information..."
            className="min-h-[80px]"
          />
          <p className="text-xs text-muted-foreground">
            Note: Deletion requests cannot guarantee complete removal from all relays and clients.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'Publishing...' : 'Delete NIP'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}