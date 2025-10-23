import { Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import type { NostrEvent } from '@nostrify/nostrify';
import { useAppConfig } from '@/components/AppProvider';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthor } from '@/hooks/useAuthor';
import { parseRepositoryEvent, getRepositoryDisplayName, formatCloneUrl } from '@/lib/repository';
import { genUserName } from '@/lib/genUserName';
import { GitBranch, Globe, Copy, Users, Tag } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface RepositoryCardProps {
  event: NostrEvent;
  className?: string;
}

export function RepositoryCard({ event, className }: RepositoryCardProps) {
  const { toast } = useToast();
  const author = useAuthor(event.pubkey);
  const repo = parseRepositoryEvent(event);
  const { config } = useAppConfig();

  const displayName = getRepositoryDisplayName(repo);
  const authorName = author.data?.metadata?.name ?? genUserName(event.pubkey);
  const authorAvatar = author.data?.metadata?.picture;

  // Generate naddr for the repository
  const naddr = nip19.naddrEncode({
    identifier: repo.id,
    pubkey: event.pubkey,
    kind: 30617,
    relays: [config.relayUrl],
  });

  const handleCopyClone = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied to clipboard",
      description: "Clone URL copied to clipboard",
    });
  };

  return (
    <Card className={`hover:shadow-lg transition-all duration-300 border-primary/20 ${className || ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <Link
              to={`/${naddr}`}
              className="block group"
            >
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {displayName}
              </h3>
            </Link>
            {repo.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {repo.description}
              </p>
            )}
          </div>
        </div>

        {/* Author info */}
        <div className="flex items-center space-x-2 mt-3">
          <Link
            to={`/${nip19.npubEncode(event.pubkey)}`}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={authorAvatar} alt={authorName} />
              <AvatarFallback className="text-xs">
                {authorName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground hover:text-primary transition-colors truncate">
              {authorName}
            </span>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Tags */}
        {repo.tags && repo.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {repo.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
            {repo.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{repo.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Clone URLs */}
        {repo.clone && repo.clone.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <GitBranch className="h-4 w-4 mr-1" />
              Clone
            </div>
            {repo.clone.slice(0, 2).map((url, index) => (
              <div key={index} className="flex items-center space-x-2 text-xs">
                <code className="flex-1 bg-muted px-2 py-1 rounded text-xs font-mono truncate">
                  {formatCloneUrl(url)}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyClone(url)}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Web URLs */}
        {repo.web && repo.web.length > 0 && (
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <a
              href={repo.web[0]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline truncate"
            >
              Browse Repository
            </a>
          </div>
        )}

        {/* Maintainers */}
        {repo.maintainers && repo.maintainers.length > 0 && (
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {repo.maintainers.length} maintainer{repo.maintainers.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-border/50">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link to={`/${naddr}`}>
              <Globe className="h-3 w-3 mr-1" />
              View
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}