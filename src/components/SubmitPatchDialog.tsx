import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, ExternalLink, GitPullRequest, Terminal } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface SubmitPatchDialogProps {
  children: React.ReactNode;
}

export function SubmitPatchDialog({ children }: SubmitPatchDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const installCommand = 'curl -Ls https://ngit.dev/install.sh | bash';
  const submitCommand = 'ngit send';

  const handleCopyCommand = (command: string, description: string) => {
    navigator.clipboard.writeText(command);
    toast({
      title: "Copied to clipboard",
      description: `${description} copied to clipboard`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitPullRequest className="h-5 w-5" />
            Submit a Patch
          </DialogTitle>
          <DialogDescription>
            Learn how to submit patches to this repository using ngit
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Install ngit */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                1
              </span>
              Install ngit
            </h3>
            <p className="text-sm text-muted-foreground">
              First, install ngit on your system:
            </p>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Terminal className="h-4 w-4 text-muted-foreground" />
                  <code className="flex-1 bg-muted px-3 py-2 rounded font-mono text-sm">
                    {installCommand}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyCommand(installCommand, 'Install command')}
                    aria-label="Copy install command"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Step 2: Clone and make changes */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                2
              </span>
              Clone and make your changes
            </h3>
            <p className="text-sm text-muted-foreground">
              Clone the repository, create a new branch, and make your changes as you normally would with git.
            </p>
          </div>

          {/* Step 3: Submit patch */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                3
              </span>
              Submit your patch
            </h3>
            <p className="text-sm text-muted-foreground">
              From within the cloned repository directory, run:
            </p>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Terminal className="h-4 w-4 text-muted-foreground" />
                  <code className="flex-1 bg-muted px-3 py-2 rounded font-mono text-sm">
                    {submitCommand}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyCommand(submitCommand, 'Submit command')}
                    aria-label="Copy submit command"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Learn more */}
          <div className="space-y-3">
            <h3 className="font-semibold">Learn more</h3>
            <p className="text-sm text-muted-foreground">
              For detailed documentation and advanced usage, visit:
            </p>
            <a
              href="https://ngit.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              ngit.dev
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}