import { useState } from 'react';
import { nip19 } from 'nostr-tools';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Cpu, 
  Zap, 
  Download, 
  Eye, 
  MoreHorizontal,
  Copy,
  ExternalLink,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/useToast';
import { JobResultDialog } from '@/components/JobResultDialog';

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
  progress?: number;
  error?: string;
  feedback?: string;
}

interface DVMJobCardProps {
  job: DVMJob;
}

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    label: 'Pending'
  },
  processing: {
    icon: Cpu,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    label: 'Processing'
  },
  completed: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    label: 'Completed'
  },
  failed: {
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    label: 'Failed'
  },
  'payment-required': {
    icon: Zap,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    label: 'Payment Required'
  }
};

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

export function DVMJobCard({ job }: DVMJobCardProps) {
  const [showResult, setShowResult] = useState(false);
  const { toast } = useToast();
  
  const author = useAuthor(job.pubkey);
  const serviceAuthor = useAuthor(job.service?.pubkey || '');
  
  const metadata = author.data?.metadata;
  const serviceMetadata = serviceAuthor.data?.metadata;

  const displayName = metadata?.name || genUserName(job.pubkey);
  const serviceName = job.service?.name || serviceMetadata?.name || 
    (job.service?.pubkey ? genUserName(job.service.pubkey) : 'Unknown Service');

  const statusConfig = STATUS_CONFIG[job.status];
  const StatusIcon = statusConfig.icon;

  const copyJobId = () => {
    navigator.clipboard.writeText(job.id);
    toast({ title: 'Job ID copied to clipboard' });
  };

  const formatInput = () => {
    if (!job.input || job.input.length === 0) return 'No input specified';
    
    const firstInput = job.input[0];
    if (firstInput.type === 'text') {
      return firstInput.data.length > 100 
        ? `${firstInput.data.substring(0, 100)}...`
        : firstInput.data;
    }
    
    return `${firstInput.type}: ${firstInput.data}`;
  };

  const formatPricing = () => {
    if (!job.pricing) return null;
    return `${job.pricing.amount} ${job.pricing.currency}`;
  };

  const getTimeDisplay = () => {
    const createdTime = formatDistanceToNow(new Date(job.created_at * 1000), { addSuffix: true });
    if (job.updated_at && job.updated_at !== job.created_at) {
      const updatedTime = formatDistanceToNow(new Date(job.updated_at * 1000), { addSuffix: true });
      return `Created ${createdTime}, updated ${updatedTime}`;
    }
    return `Created ${createdTime}`;
  };

  return (
    <>
      <Card className="glass border-primary/20 hover:border-primary/40 transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={metadata?.picture} alt={displayName} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base truncate">{displayName}</CardTitle>
                <CardDescription className="text-sm">
                  {KIND_NAMES[job.kind] || `Kind ${job.kind}`}
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge 
                className={`${statusConfig.bgColor} ${statusConfig.color} ${statusConfig.borderColor} border`}
              >
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass border-primary/20">
                  <DropdownMenuItem onClick={copyJobId}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Job ID
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={`/${nip19.neventEncode({ id: job.id })}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Event
                    </a>
                  </DropdownMenuItem>
                  {job.status === 'completed' && job.output && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setShowResult(true)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Result
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Input Preview */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Input
            </h4>
            <p className="text-sm text-muted-foreground bg-muted/30 rounded p-2 line-clamp-2">
              {formatInput()}
            </p>
          </div>

          {/* Progress (for processing jobs) */}
          {job.status === 'processing' && job.progress !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Progress
                </h4>
                <span className="text-xs text-muted-foreground">{job.progress}%</span>
              </div>
              <Progress value={job.progress} className="h-2" />
            </div>
          )}

          {/* Service Info */}
          {job.service?.pubkey && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Service Provider
              </h4>
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={serviceMetadata?.picture} alt={serviceName} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {serviceName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{serviceName}</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {job.status === 'failed' && job.error && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-red-500 uppercase tracking-wide">
                Error
              </h4>
              <p className="text-sm text-red-500 bg-red-500/10 rounded p-2">
                {job.error}
              </p>
            </div>
          )}

          {/* Feedback */}
          {job.feedback && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Feedback
              </h4>
              <p className="text-sm text-muted-foreground bg-muted/30 rounded p-2">
                {job.feedback}
              </p>
            </div>
          )}

          <Separator className="bg-primary/10" />

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{getTimeDisplay()}</span>
            {job.pricing && (
              <div className="flex items-center space-x-1">
                <Zap className="h-3 w-3" />
                <span>{formatPricing()}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          {job.status === 'completed' && job.output && (
            <div className="flex space-x-2">
              <Button 
                onClick={() => setShowResult(true)}
                variant="outline"
                size="sm"
                className="flex-1 border-primary/20 hover:bg-primary/10"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Result
              </Button>
              {job.output.type.startsWith('image/') || job.output.type.startsWith('audio/') || job.output.type.startsWith('video/') ? (
                <Button 
                  variant="outline"
                  size="sm"
                  className="border-primary/20 hover:bg-primary/10"
                  asChild
                >
                  <a href={job.output.data} download target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              ) : null}
            </div>
          )}

          {job.status === 'payment-required' && job.pricing?.bolt11 && (
            <Button 
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              size="sm"
            >
              <Zap className="h-4 w-4 mr-2" />
              Pay {formatPricing()}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Result Dialog */}
      {showResult && job.output && (
        <JobResultDialog 
          open={showResult} 
          onOpenChange={setShowResult}
          job={job}
        />
      )}
    </>
  );
}