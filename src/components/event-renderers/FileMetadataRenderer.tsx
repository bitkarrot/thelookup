import type { NostrEvent } from '@nostrify/nostrify';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { File, Download, Eye, Hash, HardDrive } from 'lucide-react';

interface FileMetadataRendererProps {
  event: NostrEvent;
}

export function FileMetadataRenderer({ event }: FileMetadataRendererProps) {
  const urlTag = event.tags.find(([name]) => name === 'url')?.[1];
  const mTag = event.tags.find(([name]) => name === 'm')?.[1]; // MIME type
  const xTag = event.tags.find(([name]) => name === 'x')?.[1]; // Hash
  const sizeTag = event.tags.find(([name]) => name === 'size')?.[1];
  const dimTag = event.tags.find(([name]) => name === 'dim')?.[1]; // Dimensions
  const magnetTag = event.tags.find(([name]) => name === 'magnet')?.[1];
  const blurhashTag = event.tags.find(([name]) => name === 'blurhash')?.[1];
  const thumbTag = event.tags.find(([name]) => name === 'thumb')?.[1];
  const altTag = event.tags.find(([name]) => name === 'alt')?.[1];

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (isNaN(size)) return bytes;
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    let fileSize = size;
    
    while (fileSize >= 1024 && unitIndex < units.length - 1) {
      fileSize /= 1024;
      unitIndex++;
    }
    
    return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
  };

  const isImage = mTag?.startsWith('image/');
  const isVideo = mTag?.startsWith('video/');
  const isAudio = mTag?.startsWith('audio/');

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <File className="h-4 w-4 text-muted-foreground" />
        <Badge variant="default">File Metadata</Badge>
        {mTag && (
          <Badge variant="outline" className="text-xs">
            {mTag}
          </Badge>
        )}
      </div>

      {/* File Preview */}
      {urlTag && (
        <div className="space-y-3">
          {isImage && (
            <div className="rounded-lg overflow-hidden bg-muted">
              <img
                src={thumbTag || urlTag}
                alt={altTag || 'File preview'}
                className="w-full max-h-64 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          
          {isVideo && (
            <div className="rounded-lg overflow-hidden bg-muted">
              <video
                src={urlTag}
                poster={thumbTag}
                controls
                className="w-full max-h-64"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
          
          {isAudio && (
            <div className="p-4 bg-muted rounded-lg">
              <audio src={urlTag} controls className="w-full">
                Your browser does not support the audio tag.
              </audio>
            </div>
          )}
        </div>
      )}

      {/* File Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {sizeTag && (
          <div className="flex items-center space-x-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">Size</div>
              <div className="text-muted-foreground">{formatFileSize(sizeTag)}</div>
            </div>
          </div>
        )}

        {dimTag && (
          <div className="flex items-center space-x-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">Dimensions</div>
              <div className="text-muted-foreground">{dimTag}</div>
            </div>
          </div>
        )}

        {xTag && (
          <div className="flex items-center space-x-2 md:col-span-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="font-medium">Hash</div>
              <div className="text-muted-foreground font-mono text-xs break-all">
                {xTag}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      {event.content && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Description</h3>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
            {event.content}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {urlTag && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(urlTag, '_blank')}
          >
            <Eye className="h-4 w-4 mr-2" />
            View File
          </Button>
        )}
        
        {urlTag && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const a = document.createElement('a');
              a.href = urlTag;
              a.download = '';
              a.click();
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        )}

        {magnetTag && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(magnetTag, '_blank')}
          >
            Magnet Link
          </Button>
        )}
      </div>

      {/* Additional metadata */}
      {(blurhashTag || altTag) && (
        <div className="space-y-2 text-sm">
          {altTag && (
            <div>
              <span className="font-medium">Alt text: </span>
              <span className="text-muted-foreground">{altTag}</span>
            </div>
          )}
          
          {blurhashTag && (
            <div>
              <span className="font-medium">Blurhash: </span>
              <span className="text-muted-foreground font-mono text-xs">{blurhashTag}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}