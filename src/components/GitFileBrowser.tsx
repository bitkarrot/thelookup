import { useState, useEffect } from 'react';
import { useGitRepository, type GitFileEntry } from '@/hooks/useGitRepository';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileViewer } from '@/components/FileViewer';
import { FileEditor } from '@/components/FileEditor';
import {
  Folder,
  File,
  Download,
  RefreshCw,
  ChevronRight,
  Home,
  GitBranch,
  AlertCircle,
  GitCommit,
  Edit3,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GitFileBrowserProps {
  repoId: string;
  cloneUrl?: string;
  className?: string;
  repositoryNaddr?: string;
  repositoryOwnerPubkey?: string;
}

interface BreadcrumbItem {
  name: string;
  path: string;
}

export function GitFileBrowser({
  repoId,
  cloneUrl,
  className,
  repositoryNaddr,
  repositoryOwnerPubkey
}: GitFileBrowserProps) {
  const [currentPath, setCurrentPath] = useState('.');
  const [selectedFile, setSelectedFile] = useState<{ path: string; name: string; mode: 'view' | 'edit' } | null>(null);
  const { user } = useCurrentUser();
  const { state, isCloned, cloneRepository, useFileList, useLatestCommit } = useGitRepository(repoId, cloneUrl);

  const { data: files, isLoading: filesLoading, error: filesError, refetch } = useFileList(currentPath);
  const { data: latestCommit } = useLatestCommit(currentPath);

  // Automatically start cloning when component mounts if repository isn't cloned
  useEffect(() => {
    if (cloneUrl && !isCloned && !state.isCloning && !state.error) {
      cloneRepository();
    }
  }, [cloneUrl, isCloned, state.isCloning, state.error, cloneRepository]);

  // Build breadcrumb navigation
  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'Root', path: '.' }
  ];

  if (currentPath !== '.') {
    const parts = currentPath.split('/');
    let buildPath = '';

    for (const part of parts) {
      buildPath = buildPath ? `${buildPath}/${part}` : part;
      breadcrumbs.push({
        name: part,
        path: buildPath
      });
    }
  }

  const handleFileClick = (file: GitFileEntry, mode: 'view' | 'edit' = 'view') => {
    if (file.type === 'tree') {
      const newPath = currentPath === '.' ? file.path : `${currentPath}/${file.path}`;
      setCurrentPath(newPath);
    } else {
      // Open file viewer/editor for files
      const fullPath = currentPath === '.' ? file.path : `${currentPath}/${file.path}`;
      setSelectedFile({ path: fullPath, name: file.path, mode });
    }
  };

  const handleEditFile = (file: GitFileEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    handleFileClick(file, 'edit');
  };

  const handleViewFile = (file: GitFileEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    handleFileClick(file, 'view');
  };

  const handleBreadcrumbClick = (path: string) => {
    setCurrentPath(path);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!cloneUrl) {
    return (
      <div className={className}>
        <div className="border border-border rounded-lg py-12 text-center">
          <GitBranch className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No clone URL available for this repository</p>
        </div>
      </div>
    );
  }

  if (!isCloned && !state.isCloning) {
    return (
      <div className={className}>
        <div className="border border-border rounded-lg">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              <span className="font-medium">Repository Files</span>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="text-center space-y-4">
              {state.error ? (
                <>
                  <p className="text-muted-foreground">
                    Failed to automatically clone repository
                  </p>
                  <Button onClick={cloneRepository} disabled={state.isCloning}>
                    <Download className="h-4 w-4 mr-2" />
                    Retry Clone
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">
                    Preparing to clone repository...
                  </p>
                  <Button onClick={cloneRepository} disabled={state.isCloning}>
                    <Download className="h-4 w-4 mr-2" />
                    Clone Repository
                  </Button>
                </>
              )}
            </div>
            {state.error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {state.error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (state.isCloning) {
    return (
      <div className={className}>
        {/* Breadcrumb Navigation Skeleton */}
        <div className="flex items-center gap-1 text-sm mb-4">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-16" />
        </div>

        {/* Latest Commit Header Skeleton */}
        <div className="border border-border rounded-t-lg bg-muted/30 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-6 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </div>

        {/* File list skeleton */}
        <div className="border border-t-0 border-border rounded-b-lg">
          <div className="divide-y divide-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3 px-4">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 flex-1 max-w-48" />
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.path} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-3 w-3" />}
            <button
              onClick={() => handleBreadcrumbClick(crumb.path)}
              className="hover:text-foreground transition-colors"
            >
              {index === 0 ? <Home className="h-3 w-3" /> : crumb.name}
            </button>
          </div>
        ))}
      </div>

      {/* Latest Commit Header - GitHub style */}
      <div className="border border-border rounded-t-lg bg-muted/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {latestCommit ? (
              <>
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarImage
                    src={`https://github.com/${latestCommit.author.name}.png`}
                    alt={latestCommit.author.name}
                  />
                  <AvatarFallback className="text-xs">
                    {latestCommit.author.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">
                      {latestCommit.author.name}
                    </span>
                    <span className="text-sm text-muted-foreground truncate">
                      {latestCommit.message.split('\n')[0]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Latest commit</span>
                    <span className="font-mono">{latestCommit.oid.slice(0, 7)}</span>
                    <span>{formatDate(latestCommit.author.timestamp)}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <GitCommit className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-muted-foreground">
                    No commit information available
                  </div>
                </div>
              </>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()} className="flex-shrink-0">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* File List */}
      <div className="border border-t-0 border-border rounded-b-lg">
        {filesLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3 px-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : filesError ? (
          <div className="text-center py-12 space-y-4">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
            <div className="space-y-2">
              <p className="text-destructive">Failed to load files</p>
              <p className="text-sm text-muted-foreground">
                {filesError instanceof Error ? filesError.message : 'Unknown error'}
              </p>
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        ) : !files || files.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">This directory is empty</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {files.map((file) => (
              <div
                key={file.path}
                className={cn(
                  "group flex items-center gap-3 py-3 px-4 transition-colors hover:bg-muted/50",
                  file.type === 'file' && "hover:bg-primary/5"
                )}
              >
                <div
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                  onClick={() => handleFileClick(file)}
                >
                  {file.type === 'tree' ? (
                    <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  ) : (
                    <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className="truncate font-mono text-sm text-foreground hover:text-primary hover:underline">
                    {file.path}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {file.type === 'file' && file.size && (
                    <span className="font-mono text-xs text-muted-foreground text-right min-w-16">
                      {formatFileSize(file.size)}
                    </span>
                  )}

                  {file.type === 'file' && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => handleViewFile(file, e)}
                        title="View file"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      {user && repositoryNaddr && repositoryOwnerPubkey && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => handleEditFile(file, e)}
                          title="Edit file"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File Viewer/Editor Modals */}
      {selectedFile && selectedFile.mode === 'view' && (
        <FileViewer
          repoId={repoId}
          filePath={selectedFile.path}
          fileName={selectedFile.name}
          isOpen={!!selectedFile}
          onClose={() => setSelectedFile(null)}
          onEdit={user && repositoryNaddr && repositoryOwnerPubkey ? () => {
            setSelectedFile({ ...selectedFile, mode: 'edit' });
          } : undefined}
        />
      )}

      {selectedFile && selectedFile.mode === 'edit' && repositoryNaddr && repositoryOwnerPubkey && (
        <FileEditor
          repoId={repoId}
          repositoryNaddr={repositoryNaddr}
          repositoryOwnerPubkey={repositoryOwnerPubkey}
          filePath={selectedFile.path}
          fileName={selectedFile.name}
          isOpen={!!selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </div>
  );
}