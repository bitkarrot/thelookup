import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Loader2, AlertCircle, Star } from 'lucide-react';
import { useFeaturedApps } from '@/hooks/useFeaturedApps';
import { appCategoryColors, platformColors } from '@/lib/parseFeaturedApps';

interface FeaturedAppsProps {
  title?: string;
  subtitle?: string;
  limit?: number;
  showCategories?: boolean;
  showPlatforms?: boolean;
  className?: string;
}

export function FeaturedApps({ 
  title = "Featured Apps",
  subtitle = "Discover the most popular applications in the Nostr ecosystem",
  limit,
  showCategories = true,
  showPlatforms = true,
  className = ""
}: FeaturedAppsProps) {
  const { apps, loading, error } = useFeaturedApps();

  // Apply limit if specified
  const displayApps = limit ? apps.slice(0, limit) : apps;

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">{title}</h2>
          </div>
          {subtitle && (
            <p className="text-muted-foreground">{subtitle}</p>
          )}
        </div>
        
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading featured apps...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">{title}</h2>
          </div>
          {subtitle && (
            <p className="text-muted-foreground">{subtitle}</p>
          )}
        </div>
        
        <div className="flex items-center justify-center py-12">
          <Card className="bg-destructive/5 border-destructive/20">
            <CardContent className="py-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span>Failed to load featured apps: {error}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Star className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        {subtitle && (
          <p className="text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* Apps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayApps.map((app) => (
          <Card
            key={app.name}
            className="group transition-all duration-300 border-primary/20 hover:border-accent/60 bg-card shadow-sm hover:shadow-lg cursor-pointer"
            onClick={() => window.open(app.url, '_blank', 'noopener,noreferrer')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-accent/20 group-hover:text-accent transition-colors">
                    {app.icon}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg group-hover:text-accent transition-colors">
                      {app.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {showCategories && (
                        <span className={`text-xs px-2 py-1 rounded-full border ${appCategoryColors[app.category] || appCategoryColors.Social}`}>
                          {app.category}
                        </span>
                      )}
                      {showPlatforms && (
                        <span className={`text-xs px-2 py-1 rounded-full border ${platformColors[app.platform] || platformColors.Web}`}>
                          {app.platform}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                {app.description}
              </p>
              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-accent transition-colors font-medium"
              >
                Try App
                <ExternalLink className="h-4 w-4" />
              </a>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Show more link if limited */}
      {limit && apps.length > limit && (
        <div className="text-center mt-8">
          <p className="text-muted-foreground">
            Showing {limit} of {apps.length} featured apps
          </p>
        </div>
      )}
    </div>
  );
}
