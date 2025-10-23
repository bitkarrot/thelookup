import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { useAppConfig } from '@/components/AppProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useCreateIssue } from '@/hooks/useRepositories';
import { useToast } from '@/hooks/useToast';
import { AlertCircle } from 'lucide-react';

interface CreateIssueFormProps {
  repositoryPubkey: string;
  repositoryId: string;
  onSuccess?: () => void;
}

export function CreateIssueForm({ repositoryPubkey, repositoryId, onSuccess }: CreateIssueFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const { mutate: createIssue, isPending } = useCreateIssue();
  const { config } = useAppConfig();

  const [formData, setFormData] = useState({
    subject: '',
    content: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create an issue.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.subject.trim()) {
      toast({
        title: "Subject required",
        description: "Please provide a subject for the issue.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.content.trim()) {
      toast({
        title: "Content required",
        description: "Please provide a description for the issue.",
        variant: "destructive",
      });
      return;
    }

    createIssue({
      repositoryPubkey,
      repositoryId,
      subject: formData.subject.trim(),
      content: formData.content.trim(),
      labels: [],
      signer: user.signer,
    }, {
      onSuccess: () => {
        toast({
          title: "Issue created",
          description: "Your issue has been submitted successfully.",
        });

        // Reset form
        setFormData({
          subject: '',
          content: '',
        });

        if (onSuccess) {
          onSuccess();
        } else {
          // Navigate back to repository page
          const naddr = nip19.naddrEncode({
            identifier: repositoryId,
            pubkey: repositoryPubkey,
            kind: 30617,
            relays: [config.relayUrl],
          });
          navigate(`/${naddr}`);
        }
      },
      onError: (error) => {
        console.error('Failed to create issue:', error);
        toast({
          title: "Failed to create issue",
          description: "There was an error submitting your issue. Please try again.",
          variant: "destructive",
        });
      },
    });
  };



  if (!user) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Please log in to create an issue.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Create New Issue
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Brief description of the issue"
              required
            />
          </div>



          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Description *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Describe the issue in detail. You can use Markdown formatting."
              rows={8}
              required
            />
            <p className="text-sm text-muted-foreground">
              Supports Markdown formatting. Be as detailed as possible to help maintainers understand the issue.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Issue'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (onSuccess) {
                  onSuccess();
                } else {
                  const naddr = nip19.naddrEncode({
                    identifier: repositoryId,
                    pubkey: repositoryPubkey,
                    kind: 30617,
                    relays: [config.relayUrl],
                  });
                  navigate(`/${naddr}`);
                }
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}