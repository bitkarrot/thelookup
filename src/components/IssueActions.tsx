import { useState } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useDeleteIssue } from '@/hooks/useDeleteIssue';
import { useUpdateIssueStatus, type IssueStatus } from '@/hooks/useIssueStatus';
import { useToast } from '@/hooks/useToast';
import { parseRepositoryEvent } from '@/lib/repository';
import { MoreHorizontal, Trash2, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';

interface IssueActionsProps {
  issue: NostrEvent;
  repository: NostrEvent;
  currentStatus: IssueStatus;
}

export function IssueActions({ issue, repository, currentStatus }: IssueActionsProps) {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const { mutate: deleteIssue, isPending: isDeleting } = useDeleteIssue();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateIssueStatus();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus>('open');
  const [statusComment, setStatusComment] = useState('');

  if (!user) return null;

  const repositoryData = parseRepositoryEvent(repository);
  const isIssueAuthor = user.pubkey === issue.pubkey;
  const isRepositoryOwner = user.pubkey === repository.pubkey;
  const isMaintainer = repositoryData.maintainers.includes(user.pubkey);

  // Users who can manage issue status (open/close/resolve)
  const canManageStatus = isRepositoryOwner || isMaintainer;

  // Only issue author can delete their own issues
  const canDelete = isIssueAuthor;

  if (!canDelete && !canManageStatus) {
    return null;
  }

  const handleDelete = () => {
    deleteIssue(
      { event: issue },
      {
        onSuccess: () => {
          toast({
            title: "Issue deleted",
            description: "The issue has been deleted successfully.",
          });
          setShowDeleteDialog(false);
        },
        onError: (error) => {
          console.error('Failed to delete issue:', error);
          toast({
            title: "Failed to delete issue",
            description: "There was an error deleting the issue. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleStatusUpdate = () => {
    updateStatus(
      {
        issueEvent: issue,
        status: selectedStatus,
        comment: statusComment.trim(),
        repositoryPubkey: repository.pubkey,
      },
      {
        onSuccess: () => {
          toast({
            title: "Status updated",
            description: `Issue status changed to ${selectedStatus}.`,
          });
          setShowStatusDialog(false);
          setStatusComment('');
        },
        onError: (error) => {
          console.error('Failed to update status:', error);
          toast({
            title: "Failed to update status",
            description: "There was an error updating the issue status. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const statusOptions = [
    { value: 'open' as IssueStatus, label: 'Open', icon: AlertCircle },
    { value: 'resolved' as IssueStatus, label: 'Resolved', icon: CheckCircle },
    { value: 'closed' as IssueStatus, label: 'Closed', icon: XCircle },
    { value: 'draft' as IssueStatus, label: 'Draft', icon: FileText },
  ];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canManageStatus && (
            <>
              {statusOptions
                .filter(option => option.value !== currentStatus)
                .map((option) => {
                  const Icon = option.icon;
                  return (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => {
                        setSelectedStatus(option.value);
                        setShowStatusDialog(true);
                      }}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      Mark as {option.label}
                    </DropdownMenuItem>
                  );
                })}
              {canDelete && <DropdownMenuSeparator />}
            </>
          )}

          {canDelete && (
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Issue
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Issue</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this issue? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Issue Status</DialogTitle>
            <DialogDescription>
              Change the status of this issue to "{selectedStatus}".
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status-comment">Comment (optional)</Label>
              <Textarea
                id="status-comment"
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
                placeholder="Add a comment about this status change..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStatusDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? 'Updating...' : `Mark as ${selectedStatus}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}