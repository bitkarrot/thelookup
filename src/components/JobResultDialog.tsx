import { nip19 } from 'nostr-tools';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  Copy, 
  ExternalLink, 
  FileText, 
  Image, 
  Music, 
  Video, 
  File,
  CheckCircle,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { formatDistanceToNow } from 'date-fns';
import { CodeBlock } from '@/components/CodeBlock';

interface DVMJob {
  id: string;
  kind: number;
  pubkey: string;
  content: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'payment-required';
  created_at: number;
  updated_at?: number;
  input?: {
    type: 'text' | 'url' | 'event' | 'job';
    data: string;
    marker?: string;
  }[];
  output?: {
    type: string;
    data: string;
    size?: number;
  };
  pricing?: {
    amount: number;
    currency: string;
    bolt11?: string;
  };
  service?: {
    pubkey: string;
    name?: string;
  };
}

interface JobResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: DVMJob;
}

const KIND_NAMES: Record<number, string> = {
  5000: 'Text Processing',
  5001: 'Image Generation',
  5002: 'Image Enhancement',
  5003: 'Speech to Text',
  5004: 'Text to Speech',
  5005: 'Translation',
  5006: 'Summarization',
  5007: 'Content Moderation',
  5008: 'Sentiment Analysis',
  5009: 'OCR',
  5010: 'Video Processing',
  5011: 'Audio Processing',
  5012: 'Code Analysis',
  5013: 'Data Analysis',
  5014: 'AI Chat',
  5015: 'Content Generation',
};

export function JobResultDialog({ open, onOpenChange, job }: JobResultDialogProps) {
  const { toast } = useToast();

  if (!job.output) {
    return null;
  }

  const copyResult = () => {
    navigator.clipboard.writeText(job.output!.data);
    toast({ title: 'Result copied to clipboard' });
  };

  const copyJobId = () => {
    navigator.clipboard.writeText(job.id);
    toast({ title: 'Job ID copied to clipboard' });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('audio/')) return Music;
    if (mimeType.startsWith('video/')) return Video;
    if (mimeType.startsWith('text/')) return FileText;
    return File;
  };

  const isTextContent = (mimeType: string) => {
    return mimeType.startsWith('text/') || 
           mimeType === 'application/json' ||
           mimeType === 'application/xml';
  };

  const isImageContent = (mimeType: string) => {
    return mimeType.startsWith('image/');
  };

  const isAudioContent = (mimeType: string) => {
    return mimeType.startsWith('audio/');
  };

  const isVideoContent = (mimeType: string) => {
    return mimeType.startsWith('video/');
  };

  const renderContent = () => {
    const { type, data } = job.output!;

    if (isTextContent(type)) {
      if (type === 'application/json') {
        try {
          const parsed = JSON.parse(data);
          return (
            <CodeBlock className="max-h-96 overflow-y-auto bg-muted/30 rounded p-4">
              <code className="text-sm">{JSON.stringify(parsed, null, 2)}</code>
            </CodeBlock>
          );
        } catch {
          return (
            <div className="bg-muted/30 rounded p-4 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm">{data}</pre>
            </div>
          );
        }
      }
      
      if (type === 'text/markdown') {
        return (
          <div className="bg-muted/30 rounded p-4 max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm font-mono">{data}</pre>
          </div>
        );
      }
      
      return (
        <div className="bg-muted/30 rounded p-4 max-h-96 overflow-y-auto">
          <pre className="whitespace-pre-wrap text-sm">{data}</pre>
        </div>
      );
    }

    if (isImageContent(type)) {
      return (
        <div className="space-y-4">
          <img 
            src={data} 
            alt="Job result" 
            className="max-w-full max-h-96 rounded border border-primary/20 mx-auto"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="text-center">
            <Button 
              variant="outline" 
              asChild
              className="border-primary/20 hover:bg-primary/10"
            >
              <a href={data} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in new tab
              </a>
            </Button>
          </div>
        </div>
      );
    }

    if (isAudioContent(type)) {
      return (
        <div className="space-y-4">
          <audio 
            controls 
            className="w-full"
            src={data}
          >
            Your browser does not support the audio element.
          </audio>
          <div className="text-center">
            <Button 
              variant="outline" 
              asChild
              className="border-primary/20 hover:bg-primary/10"
            >
              <a href={data} download target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Download Audio
              </a>
            </Button>
          </div>
        </div>
      );
    }

    if (isVideoContent(type)) {
      return (
        <div className="space-y-4">
          <video 
            controls 
            className="max-w-full max-h-96 rounded border border-primary/20 mx-auto"
            src={data}
          >
            Your browser does not support the video element.
          </video>
          <div className="text-center">
            <Button 
              variant="outline" 
              asChild
              className="border-primary/20 hover:bg-primary/10"
            >
              <a href={data} download target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Download Video
              </a>
            </Button>
          </div>
        </div>
      );
    }

    // For other file types, show download link
    return (
      <div className="text-center space-y-4">
        <div className="bg-muted/30 rounded p-8">
          <File className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            File ready for download
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {type} • {formatFileSize(job.output?.size)}
          </p>
        </div>
        <Button 
          variant="outline" 
          asChild
          className="border-primary/20 hover:bg-primary/10"
        >
          <a href={data} download target="_blank" rel="noopener noreferrer">
            <Download className="h-4 w-4 mr-2" />
            Download File
          </a>
        </Button>
      </div>
    );
  };

  const FileIcon = getFileIcon(job.output.type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Job Result</span>
          </DialogTitle>
          <DialogDescription>
            {KIND_NAMES[job.kind] || `Kind ${job.kind}`} job completed successfully
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Job Info */}
          <Card className="glass border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Job Information</span>
                <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Job ID:</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <code className="bg-muted/30 px-2 py-1 rounded text-xs">
                      {job.id.substring(0, 16)}...
                    </code>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={copyJobId}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Completed:</span>
                  <p className="mt-1">
                    {job.updated_at 
                      ? formatDistanceToNow(new Date(job.updated_at * 1000), { addSuffix: true })
                      : formatDistanceToNow(new Date(job.created_at * 1000), { addSuffix: true })
                    }
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Output Type:</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <FileIcon className="h-4 w-4" />
                    <span>{job.output.type}</span>
                  </div>
                </div>
                {job.output.size && (
                  <div>
                    <span className="text-muted-foreground">File Size:</span>
                    <p className="mt-1">{formatFileSize(job.output.size)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="result" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 glass border-primary/20">
              <TabsTrigger value="result">
                <Eye className="h-4 w-4 mr-2" />
                Result
              </TabsTrigger>
              <TabsTrigger value="input">
                <FileText className="h-4 w-4 mr-2" />
                Original Input
              </TabsTrigger>
            </TabsList>

            {/* Result Tab */}
            <TabsContent value="result" className="space-y-4">
              <Card className="glass border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Job Output</span>
                    <div className="flex space-x-2">
                      {isTextContent(job.output.type) && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={copyResult}
                          className="border-primary/20 hover:bg-primary/10"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      )}
                      {!isTextContent(job.output.type) && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          asChild
                          className="border-primary/20 hover:bg-primary/10"
                        >
                          <a href={job.output.data} download target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderContent()}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Input Tab */}
            <TabsContent value="input" className="space-y-4">
              <Card className="glass border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">Original Input</CardTitle>
                  <CardDescription>
                    The input data that was provided for this job
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {job.input && job.input.length > 0 ? (
                    job.input.map((input, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="border-primary/20">
                            {input.type}
                          </Badge>
                          {input.marker && (
                            <Badge variant="outline" className="border-muted">
                              {input.marker}
                            </Badge>
                          )}
                        </div>
                        <div className="bg-muted/30 rounded p-3">
                          <pre className="whitespace-pre-wrap text-sm">
                            {input.type === 'text' && input.data.length > 500
                              ? `${input.data.substring(0, 500)}...`
                              : input.data
                            }
                          </pre>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No input data available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Separator className="bg-primary/10" />

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-primary/20 hover:bg-primary/10"
            >
              Close
            </Button>
            <Button 
              asChild
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <a href={`/${nip19.neventEncode({ id: job.id })}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Event
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}