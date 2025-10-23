import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, XCircle, FileText } from 'lucide-react';
import type { IssueStatus } from '@/hooks/useIssueStatus';
import { cn } from '@/lib/utils';

interface IssueStatusBadgeProps {
  status: IssueStatus;
  className?: string;
}

export function IssueStatusBadge({ status, className }: IssueStatusBadgeProps) {
  const statusConfig = {
    open: {
      label: 'Open',
      icon: AlertCircle,
      variant: 'default' as const,
      className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
    },
    resolved: {
      label: 'Resolved',
      icon: CheckCircle,
      variant: 'secondary' as const,
      className: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
    },
    closed: {
      label: 'Closed',
      icon: XCircle,
      variant: 'outline' as const,
      className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    },
    draft: {
      label: 'Draft',
      icon: FileText,
      variant: 'outline' as const,
      className: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}