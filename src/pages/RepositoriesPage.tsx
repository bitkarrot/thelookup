import { useSeoMeta } from '@unhead/react';
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { RepositoryCard } from '@/components/RepositoryCard';
import { RepositoryCardSkeleton } from '@/components/RepositoryCardSkeleton';
import { RelaySelector } from '@/components/RelaySelector';
import { useRepositories } from '@/hooks/useRepositories';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { parseRepositoryEvent, getRepositoryDisplayName } from '@/lib/repository';
import { Search, GitBranch, Plus } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Link } from 'react-router-dom';

export default function RepositoriesPage() {
  useSeoMeta({
    title: 'Git Repositories | NostrHub',
    description: 'Discover and collaborate on git repositories shared via Nostr (NIP-34).',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  const { data: repositories, isLoading, error } = useRepositories();
  const { user } = useCurrentUser();

  // Parse repository data and collect all tags
  const parsedRepos = repositories?.map(event => ({
    event,
    data: parseRepositoryEvent(event),
  })) || [];

  const allTags = Array.from(
    new Set(
      parsedRepos
        .flatMap(repo => repo.data.tags || [])
        .filter(Boolean)
    )
  ).sort();

  // Filter repositories based on search and tag
  const filteredRepos = parsedRepos.filter(repo => {
    const matchesSearch = !searchQuery || 
      getRepositoryDisplayName(repo.data).toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.data.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.data.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = !selectedTag || repo.data.tags?.includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="px-4 sm:px-0 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <GitBranch className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold gradient-text">
                  Git Repositories
                </h1>
              </div>
              <p className="text-muted-foreground">
                Discover and collaborate on git repositories shared via Nostr (NIP-34)
              </p>
            </div>
            
            {user && (
              <Button asChild className="self-start sm:self-auto">
                <Link to="/repositories/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Repository
                </Link>
              </Button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search repositories by name, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Tag filters */}
            {allTags.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Filter by tags:</div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedTag === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTag(null)}
                  >
                    All
                  </Button>
                  {allTags.map(tag => (
                    <Button
                      key={tag}
                      variant={selectedTag === tag ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Results count */}
          {!isLoading && repositories && (
            <div className="text-sm text-muted-foreground">
              {filteredRepos.length} of {repositories.length} repositories
              {searchQuery && ` matching "${searchQuery}"`}
              {selectedTag && ` tagged with "${selectedTag}"`}
            </div>
          )}
        </div>

        {/* Repository Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <RepositoryCardSkeleton key={i} className="sm:rounded-lg rounded-none" />
            ))}
          </div>
        ) : error ? (
          <div className="mt-6">
            <Card className="border-dashed border-destructive/50 sm:rounded-lg rounded-none mx-4 sm:mx-0">
              <CardContent className="py-12 px-8 text-center">
                <div className="max-w-sm mx-auto space-y-4">
                  <p className="text-destructive">
                    Failed to load repositories. Please try again.
                  </p>
                  <RelaySelector className="w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : filteredRepos.length === 0 ? (
          <div className="mt-6">
            <Card className="border-dashed sm:rounded-lg rounded-none mx-4 sm:mx-0">
              <CardContent className="py-12 px-8 text-center">
                <div className="max-w-sm mx-auto space-y-6">
                  <GitBranch className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">
                      {repositories?.length === 0 ? 'No repositories found' : 'No matching repositories'}
                    </h3>
                    <p className="text-muted-foreground">
                      {repositories?.length === 0 
                        ? 'No git repositories have been announced on this relay yet.'
                        : 'Try adjusting your search or filters to find repositories.'
                      }
                    </p>
                  </div>
                  {repositories?.length === 0 && (
                    <>
                      <p className="text-muted-foreground">
                        Try another relay?
                      </p>
                      <RelaySelector className="w-full" />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mt-6">
            {filteredRepos.map(({ event }) => (
              <RepositoryCard key={event.id} event={event} className="sm:rounded-lg rounded-none" />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}