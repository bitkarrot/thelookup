import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';

export type IssueStatus = 'open' | 'resolved' | 'closed' | 'draft';

export interface IssueStatusEvent {
  status: IssueStatus;
  event: NostrEvent;
  author: string;
  created_at: number;
}

/**
 * Hook to fetch the current status of an issue
 */
export function useIssueStatus(issueId: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['issue-status', issueId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      
      // Fetch status events for this issue
      const events = await nostr.query([{
        kinds: [1630, 1631, 1632, 1633], // Open, Resolved, Closed, Draft
        '#e': [issueId],
        limit: 20
      }], { signal });

      // Sort by created_at to get the most recent status
      const sortedEvents = events.sort((a, b) => b.created_at - a.created_at);
      
      if (sortedEvents.length === 0) {
        return { status: 'open' as IssueStatus, event: null, author: '', created_at: 0 };
      }

      const latestEvent = sortedEvents[0];
      let status: IssueStatus;
      
      switch (latestEvent.kind) {
        case 1630:
          status = 'open';
          break;
        case 1631:
          status = 'resolved';
          break;
        case 1632:
          status = 'closed';
          break;
        case 1633:
          status = 'draft';
          break;
        default:
          status = 'open';
      }

      return {
        status,
        event: latestEvent,
        author: latestEvent.pubkey,
        created_at: latestEvent.created_at,
      };
    },
    enabled: !!issueId,
  });
}

/**
 * Hook to update the status of an issue
 */
export function useUpdateIssueStatus() {
  const { mutateAsync: publishEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      issueEvent: NostrEvent;
      status: IssueStatus;
      comment?: string;
      repositoryPubkey?: string;
    }) => {
      const { issueEvent, status, comment = '', repositoryPubkey } = params;

      // Map status to kind
      let kind: number;
      switch (status) {
        case 'open':
          kind = 1630;
          break;
        case 'resolved':
          kind = 1631;
          break;
        case 'closed':
          kind = 1632;
          break;
        case 'draft':
          kind = 1633;
          break;
        default:
          throw new Error(`Invalid status: ${status}`);
      }

      // Build tags according to NIP-34
      const tags = [
        ['e', issueEvent.id, '', 'root'],
        ['p', issueEvent.pubkey], // Issue author
      ];

      // Add repository owner if provided
      if (repositoryPubkey) {
        tags.push(['p', repositoryPubkey]);
      }

      // Add repository reference if available
      const aTag = issueEvent.tags.find(([name]) => name === 'a')?.[1];
      if (aTag) {
        tags.push(['a', aTag]);
      }

      // Create and publish the status event
      const statusEvent = await publishEvent({
        kind,
        content: comment,
        tags,
      });

      return statusEvent;
    },
    onSuccess: (_, variables) => {
      // Invalidate issue status query
      queryClient.invalidateQueries({ 
        queryKey: ['issue-status', variables.issueEvent.id] 
      });
      
      // Also invalidate repository issues to refresh the list
      const aTag = variables.issueEvent.tags.find(([name]) => name === 'a')?.[1];
      if (aTag) {
        const [, pubkey, identifier] = aTag.split(':');
        if (pubkey && identifier) {
          queryClient.invalidateQueries({ 
            queryKey: ['repository-issues', pubkey, identifier] 
          });
        }
      }
    },
  });
}