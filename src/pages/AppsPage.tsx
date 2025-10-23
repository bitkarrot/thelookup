import { useSeoMeta } from '@unhead/react';
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useApps } from '@/hooks/useApps';
import { AppCard } from '@/components/AppCard';
import { AppCardSkeleton } from '@/components/AppCardSkeleton';
import { RelaySelector } from '@/components/RelaySelector';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Smartphone, Globe, Zap, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const POPULAR_KINDS = [
  { kind: 1, name: 'Text Notes', icon: '📝' },
  { kind: 6, name: 'Reposts', icon: '🔄' },
  { kind: 7, name: 'Reactions', icon: '❤️' },
  { kind: 30023, name: 'Articles', icon: '📄' },
  { kind: 31922, name: 'Calendar Events', icon: '📅' },
  { kind: 30402, name: 'Classified Listings', icon: '🏪' },
  { kind: 1063, name: 'File Metadata', icon: '📁' },
];

export default function AppsPage() {
  useSeoMeta({
    title: 'Nostr Apps | NostrHub',
    description: 'Discover applications that can handle different types of Nostr events. Find the perfect app for your needs.',
  });

  const { data: apps, isLoading, error } = useApps();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKind, setSelectedKind] = useState<number | null>(null);

  // Filter apps based on search term and selected kind
  const filteredApps = apps?.filter(app => {
    const matchesSearch = !searchTerm || 
      app.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.about?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesKind = !selectedKind || app.supportedKinds.includes(selectedKind);

    if (!app.name || !app.picture || !app.about || !app.website) {
      // If app is missing essential fields, skip it
      return false;
    }
    
    return matchesSearch && matchesKind;
  }) || [];

  const totalApps = filteredApps.length;
  const totalKinds = new Set(filteredApps.flatMap(app => app.supportedKinds)).size;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="px-4 sm:px-0 space-y-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <div className="relative">
                <Smartphone className="h-8 w-8 text-primary" />
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold gradient-text">Nostr Apps</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover applications that can handle different types of Nostr events. 
              Find the perfect app for your needs.
            </p>
            
            {/* Stats and Submit Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Smartphone className="h-4 w-4" />
                  <span>{totalApps} Apps</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4" />
                  <span>{totalKinds} Event Types</span>
                </div>
              </div>
              <Button asChild className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                <Link to="/apps/submit">
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Your App
                </Link>
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <Card className="sm:rounded-lg rounded-none">
            <CardHeader>
              <CardTitle className="text-lg">Find Apps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search apps by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Popular Event Types Filter */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Filter by Event Type</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedKind === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedKind(null)}
                  >
                    All Types
                  </Button>
                  {POPULAR_KINDS.map(({ kind, name, icon }) => {
                    const appCount = filteredApps.filter(app => app.supportedKinds.includes(kind)).length || 0;
                    if (appCount === 0) return null;
                    
                    return (
                      <Button
                        key={kind}
                        variant={selectedKind === kind ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedKind(selectedKind === kind ? null : kind)}
                        className="space-x-1"
                      >
                        <span>{icon}</span>
                        <span>{name}</span>
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {appCount}
                        </Badge>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <AppCardSkeleton key={i} className="sm:rounded-lg rounded-none" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-6">
            <Card className="border-dashed sm:rounded-lg rounded-none mx-4 sm:mx-0">
              <CardContent className="py-12 px-8 text-center">
                <div className="max-w-sm mx-auto space-y-6">
                  <p className="text-muted-foreground">
                    Failed to load apps. Try switching to a different relay?
                  </p>
                  <RelaySelector className="w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Apps Grid */}
        {!isLoading && !error && (
          <>
            {filteredApps.length > 0 ? (
              <>
                <div className="flex items-center justify-between mt-6 px-4 sm:px-0">
                  <h2 className="text-xl font-semibold">
                    {selectedKind ? (
                      <>Apps for {POPULAR_KINDS.find(k => k.kind === selectedKind)?.name || `Kind ${selectedKind}`}</>
                    ) : (
                      'All Apps'
                    )}
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    {filteredApps.length} {filteredApps.length === 1 ? 'app' : 'apps'}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mt-6">
                  {filteredApps.map((app) => (
                    <AppCard key={app.id} app={app} className="sm:rounded-lg rounded-none" />
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-6">
                <Card className="border-dashed sm:rounded-lg rounded-none mx-4 sm:mx-0">
                  <CardContent className="py-12 px-8 text-center">
                    <div className="max-w-sm mx-auto space-y-6">
                      <div className="space-y-2">
                        <Globe className="h-12 w-12 text-muted-foreground mx-auto" />
                        <h3 className="text-lg font-medium">No Apps Found</h3>
                        <p className="text-muted-foreground">
                          {searchTerm || selectedKind 
                            ? 'No apps match your current filters. Try adjusting your search or filters.'
                            : 'No apps found on this relay. Try switching to a different relay to discover apps.'
                          }
                        </p>
                      </div>
                      {!searchTerm && !selectedKind && (
                        <RelaySelector className="w-full" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}