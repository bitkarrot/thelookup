import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Plus,
  Minus,
  Copy,
  Eye,
  Code
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

interface PatchViewerProps {
  patchContent: string;
  className?: string;
}

interface ParsedPatch {
  header: {
    from?: string;
    date?: string;
    subject?: string;
  };
  files: ParsedFile[];
}

interface ParsedFile {
  oldPath: string;
  newPath: string;
  oldMode?: string;
  newMode?: string;
  index?: string;
  hunks: Hunk[];
  stats: {
    additions: number;
    deletions: number;
  };
}

interface Hunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  header: string;
  lines: HunkLine[];
}

interface HunkLine {
  type: 'context' | 'addition' | 'deletion';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

// Parse git patch format
function parsePatch(patchContent: string): ParsedPatch {
  const lines = patchContent.split('\n');
  const patch: ParsedPatch = {
    header: {},
    files: []
  };

  let currentFile: ParsedFile | null = null;
  let currentHunk: Hunk | null = null;
  let oldLineNumber = 0;
  let newLineNumber = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Parse header information
    if (line.startsWith('From:')) {
      patch.header.from = line.substring(5).trim();
    } else if (line.startsWith('Date:')) {
      patch.header.date = line.substring(5).trim();
    } else if (line.startsWith('Subject:')) {
      patch.header.subject = line.substring(8).trim();
    }
    // Parse file diff
    else if (line.startsWith('diff --git')) {
      // Save previous file
      if (currentFile) {
        patch.files.push(currentFile);
      }

      // Extract file paths
      const match = line.match(/diff --git a\/(.+) b\/(.+)/);
      currentFile = {
        oldPath: match?.[1] || '',
        newPath: match?.[2] || '',
        hunks: [],
        stats: { additions: 0, deletions: 0 }
      };
      currentHunk = null;
    } else if (line.startsWith('index ') && currentFile) {
      currentFile.index = line.substring(6);
    } else if (line.startsWith('--- ') && currentFile) {
      // Old file path (already parsed from diff line)
    } else if (line.startsWith('+++ ') && currentFile) {
      // New file path (already parsed from diff line)
    } else if (line.startsWith('@@') && currentFile) {
      // Hunk header
      const hunkMatch = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@(.*)/);
      if (hunkMatch) {
        // Save previous hunk
        if (currentHunk) {
          currentFile.hunks.push(currentHunk);
        }

        oldLineNumber = parseInt(hunkMatch[1]);
        newLineNumber = parseInt(hunkMatch[3]);

        currentHunk = {
          oldStart: oldLineNumber,
          oldLines: parseInt(hunkMatch[2]) || 1,
          newStart: newLineNumber,
          newLines: parseInt(hunkMatch[4]) || 1,
          header: hunkMatch[5]?.trim() || '',
          lines: []
        };
      }
    } else if (currentHunk && currentFile) {
      // Hunk content
      if (line.startsWith('+')) {
        currentHunk.lines.push({
          type: 'addition',
          content: line.substring(1),
          newLineNumber: newLineNumber++
        });
        currentFile.stats.additions++;
      } else if (line.startsWith('-')) {
        currentHunk.lines.push({
          type: 'deletion',
          content: line.substring(1),
          oldLineNumber: oldLineNumber++
        });
        currentFile.stats.deletions++;
      } else if (line.startsWith(' ')) {
        currentHunk.lines.push({
          type: 'context',
          content: line.substring(1),
          oldLineNumber: oldLineNumber++,
          newLineNumber: newLineNumber++
        });
      }
    }
  }

  // Save last file and hunk
  if (currentHunk && currentFile) {
    currentFile.hunks.push(currentHunk);
  }
  if (currentFile) {
    patch.files.push(currentFile);
  }

  return patch;
}

function FileIcon() {
  return <FileText className="h-4 w-4 text-muted-foreground" />;
}

function FileDiff({ file, isExpanded, onToggle }: {
  file: ParsedFile;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { toast } = useToast();
  const totalChanges = file.stats.additions + file.stats.deletions;

  const handleCopyPath = () => {
    navigator.clipboard.writeText(file.newPath);
    toast({
      title: "Copied to clipboard",
      description: "File path copied to clipboard",
    });
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 cursor-pointer">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <FileIcon />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-mono text-sm font-medium truncate">
                  {file.newPath}
                </div>
                {file.oldPath !== file.newPath && (
                  <div className="font-mono text-xs text-muted-foreground truncate">
                    {file.oldPath} → {file.newPath}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                {file.stats.additions > 0 && (
                  <span className="text-green-600 dark:text-green-400">
                    +{file.stats.additions}
                  </span>
                )}
                {file.stats.deletions > 0 && (
                  <span className="text-red-600 dark:text-red-400">
                    -{file.stats.deletions}
                  </span>
                )}
              </div>

              {/* Visual diff bar */}
              {totalChanges > 0 && (
                <div className="flex h-2 w-16 rounded-full overflow-hidden bg-border">
                  {file.stats.additions > 0 && (
                    <div
                      className="bg-green-500"
                      style={{ width: `${(file.stats.additions / totalChanges) * 100}%` }}
                    />
                  )}
                  {file.stats.deletions > 0 && (
                    <div
                      className="bg-red-500"
                      style={{ width: `${(file.stats.deletions / totalChanges) * 100}%` }}
                    />
                  )}
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyPath();
                }}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-border">
            {file.hunks.map((hunk, hunkIndex) => (
              <div key={hunkIndex} className="border-b border-border last:border-b-0">
                {/* Hunk header */}
                <div className="bg-muted/20 px-4 py-2 text-sm font-mono text-muted-foreground border-b border-border">
                  @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
                  {hunk.header && <span className="ml-2">{hunk.header}</span>}
                </div>

                {/* Hunk lines */}
                <div className="font-mono text-sm">
                  {hunk.lines.map((line, lineIndex) => (
                    <div
                      key={lineIndex}
                      className={cn(
                        "flex items-center",
                        line.type === 'addition' && "bg-green-50 dark:bg-green-950/20",
                        line.type === 'deletion' && "bg-red-50 dark:bg-red-950/20"
                      )}
                    >
                      {/* Line numbers */}
                      <div className="flex text-xs text-muted-foreground bg-muted/30 border-r border-border">
                        <div className="w-12 px-2 py-1 text-right">
                          {line.oldLineNumber || ''}
                        </div>
                        <div className="w-12 px-2 py-1 text-right border-l border-border">
                          {line.newLineNumber || ''}
                        </div>
                      </div>

                      {/* Change indicator */}
                      <div className="w-6 flex items-center justify-center py-1">
                        {line.type === 'addition' && (
                          <Plus className="h-3 w-3 text-green-600 dark:text-green-400" />
                        )}
                        {line.type === 'deletion' && (
                          <Minus className="h-3 w-3 text-red-600 dark:text-red-400" />
                        )}
                      </div>

                      {/* Line content */}
                      <div className="flex-1 px-2 py-1 whitespace-pre-wrap break-all">
                        {line.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function PatchViewer({ patchContent, className }: PatchViewerProps) {
  const [activeTab, setActiveTab] = useState<'diff' | 'raw'>('diff');
  const [expandedFiles, setExpandedFiles] = useState<Set<number>>(new Set([0])); // Expand first file by default
  const { toast } = useToast();

  const parsedPatch = parsePatch(patchContent);

  const handleCopyPatch = () => {
    navigator.clipboard.writeText(patchContent);
    toast({
      title: "Copied to clipboard",
      description: "Patch content copied to clipboard",
    });
  };

  const toggleFileExpansion = (fileIndex: number) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(fileIndex)) {
      newExpanded.delete(fileIndex);
    } else {
      newExpanded.add(fileIndex);
    }
    setExpandedFiles(newExpanded);
  };

  const toggleAllFiles = () => {
    if (expandedFiles.size === parsedPatch.files.length) {
      setExpandedFiles(new Set());
    } else {
      setExpandedFiles(new Set(parsedPatch.files.map((_, i) => i)));
    }
  };

  const totalStats = parsedPatch.files.reduce(
    (acc, file) => ({
      additions: acc.additions + file.stats.additions,
      deletions: acc.deletions + file.stats.deletions
    }),
    { additions: 0, deletions: 0 }
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Patch header */}
      {parsedPatch.header.subject && (
        <div className="space-y-2">
          <h4 className="font-medium">{parsedPatch.header.subject}</h4>
          {(parsedPatch.header.from || parsedPatch.header.date) && (
            <div className="text-sm text-muted-foreground">
              {parsedPatch.header.from && <span>by {parsedPatch.header.from}</span>}
              {parsedPatch.header.from && parsedPatch.header.date && <span> • </span>}
              {parsedPatch.header.date && <span>{new Date(parsedPatch.header.date).toLocaleDateString()}</span>}
            </div>
          )}
        </div>
      )}

      {/* Stats and controls */}
      {parsedPatch.files.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {parsedPatch.files.length} file{parsedPatch.files.length !== 1 ? 's' : ''} changed
            </div>
            {(totalStats.additions > 0 || totalStats.deletions > 0) && (
              <div className="flex items-center gap-2 text-sm">
                {totalStats.additions > 0 && (
                  <span className="text-green-600 dark:text-green-400">
                    +{totalStats.additions}
                  </span>
                )}
                {totalStats.deletions > 0 && (
                  <span className="text-red-600 dark:text-red-400">
                    -{totalStats.deletions}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAllFiles}
            >
              {expandedFiles.size === parsedPatch.files.length ? 'Collapse all' : 'Expand all'}
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'diff' | 'raw')}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="diff" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Diff
            </TabsTrigger>
            <TabsTrigger value="raw" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Raw
            </TabsTrigger>
          </TabsList>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyPatch}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
        </div>

        <TabsContent value="diff" className="mt-4">
          {parsedPatch.files.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No file changes detected in this patch</p>
            </div>
          ) : (
            <div className="space-y-4">
              {parsedPatch.files.map((file, index) => (
                <FileDiff
                  key={index}
                  file={file}
                  isExpanded={expandedFiles.has(index)}
                  onToggle={() => toggleFileExpansion(index)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="raw" className="mt-4">
          <ScrollArea className="h-96 border rounded-lg">
            <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-words">
              {patchContent}
            </pre>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}