import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface AppCardSkeletonProps {
  className?: string;
}

export function AppCardSkeleton({ className }: AppCardSkeletonProps) {
  return (
    <Card className={`h-full flex flex-col ${className || ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        
        <div className="space-y-2 mt-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Supported Event Types */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <div className="flex flex-wrap gap-1">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
        
        {/* Platform Availability */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <div className="flex items-center space-x-3">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-10" />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex-1 flex flex-col justify-end space-y-2 pt-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}