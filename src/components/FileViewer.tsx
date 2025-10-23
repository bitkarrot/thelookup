import { useState } from 'react';
import { useGitRepository } from '@/hooks/useGitRepository';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { SyntaxHighlighter } from '@/components/SyntaxHighlighter';
import {
  X,
  Download,
  Copy,
  FileText,
  Code,
  AlertCircle,
  Eye,
  FileImage,
  FileVideo,
  FileAudio,
  Archive,
  Edit3
} from 'lucide-react';

import { useToast } from '@/hooks/useToast';

interface FileViewerProps {
  repoId: string;
  filePath: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

// File type detection based on extension
const getFileType = (fileName: string): 'text' | 'image' | 'video' | 'audio' | 'binary' => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  const textExtensions = [
    'txt', 'md', 'markdown', 'json', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'scss', 'sass',
    'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'hpp', 'php', 'sh', 'bash', 'zsh',
    'yml', 'yaml', 'toml', 'ini', 'cfg', 'conf', 'xml', 'svg', 'csv', 'log', 'gitignore',
    'dockerfile', 'makefile', 'cmake', 'sql', 'r', 'scala', 'kt', 'swift', 'dart', 'vue',
    'svelte', 'astro', 'elm', 'clj', 'cljs', 'hs', 'ml', 'fs', 'ex', 'exs', 'erl', 'hrl'
  ];

  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'ico', 'tiff', 'tif'];
  const videoExtensions = ['mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv', 'flv', 'mkv'];
  const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma'];

  if (textExtensions.includes(ext)) return 'text';
  if (imageExtensions.includes(ext)) return 'image';
  if (videoExtensions.includes(ext)) return 'video';
  if (audioExtensions.includes(ext)) return 'audio';

  return 'binary';
};

// Get language for syntax highlighting
const getLanguage = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'h': 'c',
    'hpp': 'cpp',
    'php': 'php',
    'sh': 'bash',
    'bash': 'bash',
    'zsh': 'bash',
    'yml': 'yaml',
    'yaml': 'yaml',
    'json': 'json',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'xml': 'xml',
    'svg': 'xml',
    'sql': 'sql',
    'md': 'markdown',
    'markdown': 'markdown',
    'dockerfile': 'dockerfile',
    'makefile': 'makefile',
    'cmake': 'cmake',
    'toml': 'toml',
    'ini': 'ini',
    'cfg': 'ini',
    'conf': 'ini',
    'r': 'r',
    'scala': 'scala',
    'kt': 'kotlin',
    'swift': 'swift',
    'dart': 'dart',
    'vue': 'vue',
    'svelte': 'svelte'
  };

  return languageMap[ext] || 'text';
};

// Format file size
const formatFileSize = (content: string): string => {
  const bytes = new TextEncoder().encode(content).length;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

// Get file icon based on type
const getFileIcon = (fileName: string) => {
  const fileType = getFileType(fileName);

  switch (fileType) {
    case 'image':
      return <FileImage className="h-4 w-4" />;
    case 'video':
      return <FileVideo className="h-4 w-4" />;
    case 'audio':
      return <FileAudio className="h-4 w-4" />;
    case 'binary':
      return <Archive className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

export function FileViewer({ repoId, filePath, fileName, isOpen, onClose, onEdit }: FileViewerProps) {
  const { useFileContent } = useGitRepository(repoId);
  const { data: content, isLoading, error } = useFileContent(filePath);
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'preview' | 'raw'>('preview');

  const fileType = getFileType(fileName);
  const language = getLanguage(fileName);

  const handleCopyContent = () => {
    if (content) {
      navigator.clipboard.writeText(content);
      toast({
        title: "Copied to clipboard",
        description: "File content copied to clipboard",
      });
    }
  };

  const handleDownload = () => {
    if (content) {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: `Downloading ${fileName}`,
      });
    }
  };

  const renderFileContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          {Array.from({ length: 20 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div className="text-center space-y-2">
            <p className="text-destructive font-medium">Failed to load file</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Unknown error occurred'}
            </p>
          </div>
        </div>
      );
    }

    if (!content) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <FileText className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">File is empty</p>
        </div>
      );
    }

    // Handle different file types
    switch (fileType) {
      case 'image':
        // For images, we can't display them directly since we only have text content
        // In a real implementation, you'd need to handle binary content differently
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <FileImage className="h-12 w-12 text-muted-foreground" />
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">Image file detected</p>
              <p className="text-sm text-muted-foreground">
                Binary content cannot be displayed as text
              </p>
            </div>
          </div>
        );

      case 'video':
      case 'audio':
      case 'binary':
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            {getFileIcon(fileName)}
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">Binary file detected</p>
              <p className="text-sm text-muted-foreground">
                This file type cannot be displayed as text
              </p>
            </div>
          </div>
        );

      default:
        // Text files
        return (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'preview' | 'raw')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="raw" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Raw
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-4">
              <div className="border rounded-lg overflow-hidden">
                {language === 'markdown' ? (
                  <ScrollArea className="h-[60vh]">
                    <div className="p-4">
                      <MarkdownRenderer content={content} />
                    </div>
                  </ScrollArea>
                ) : (
                  <ScrollArea className="h-[60vh]">
                    <SyntaxHighlighter
                      code={content}
                      language={language}
                      showLineNumbers={true}
                    />
                  </ScrollArea>
                )}
              </div>
            </TabsContent>

            <TabsContent value="raw" className="mt-4">
              <ScrollArea className="h-[60vh] border rounded-lg">
                <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-words">
                  {content}
                </pre>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getFileIcon(fileName)}
              <div>
                <DialogTitle className="text-left">{fileName}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {fileType}
                  </Badge>
                  {content && (
                    <Badge variant="outline" className="text-xs">
                      {formatFileSize(content)}
                    </Badge>
                  )}
                  {language !== 'text' && (
                    <Badge variant="outline" className="text-xs">
                      {language}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {content && fileType === 'text' && user && onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit3 className="h-4 w-4" />
                </Button>
              )}
              {content && fileType === 'text' && (
                <Button variant="outline" size="sm" onClick={handleCopyContent}>
                  <Copy className="h-4 w-4" />
                </Button>
              )}
              {content && (
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {renderFileContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}