import { useSeoMeta } from '@unhead/react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Globe, Zap, GitBranch, Search, Users, Shield, BookOpen, Hash } from 'lucide-react';
import { getPageTitle, getPageDescription } from '@/lib/siteConfig';

interface Resource {
  name: string;
  url: string;
  description: string;
  icon: React.ReactNode;
  category: string;
}

const resources: Resource[] = [
  {
    name: 'nostr.net',
    url: 'https://nostr.net',
    description: 'Home of awesome-nostr repository',
    icon: <Globe className="h-6 w-6" />,
    category: 'Official'
  },
  {
    name: 'wot.nostr.net',
    url: 'https://wot.nostr.net',
    description: 'Web of trust relay',
    icon: <Users className="h-6 w-6" />,
    category: 'Relay'
  },
  {
    name: 'relay.nostr.net',
    url: 'https://relay.nostr.net',
    description: 'Public relay run by nostr.net',
    icon: <Zap className="h-6 w-6" />,
    category: 'Relay'
  },
  {
    name: 'start.nostr.net',
    url: 'https://start.nostr.net',
    description: 'Onboarding for new users',
    icon: <BookOpen className="h-6 w-6" />,
    category: 'Tools'
  },
  {
    name: 'my.nostr.net',
    url: 'https://my.nostr.net',
    description: 'Nostr profile and data management',
    icon: <Shield className="h-6 w-6" />,
    category: 'Tools'
  },
  {
    name: 'nostr.at',
    url: 'https://nostr.at',
    description: 'Public njump instance without any tracking',
    icon: <Hash className="h-6 w-6" />,
    category: 'Gateway'
  },
  {
    name: 'nostr.eu',
    url: 'https://nostr.eu',
    description: 'Nostr landing page and http gateway in all European languages',
    icon: <Globe className="h-6 w-6" />,
    category: 'Gateway'
  },
  {
    name: 'nostr.ae',
    url: 'https://nostr.ae',
    description: 'Nostr landing page for the Middle East',
    icon: <Globe className="h-6 w-6" />,
    category: 'Gateway'
  },
  {
    name: 'search.nostr.net',
    url: 'https://search.nostr.net',
    description: 'Search events across nostr relays',
    icon: <Search className="h-6 w-6" />,
    category: 'Tools'
  }
];

const categoryColors: Record<string, string> = {
  Official: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  Relay: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  Tools: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  Client: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  Gateway: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
};

export default function ResourcesPage() {
  useSeoMeta({
    title: getPageTitle('Nostr Resources'),
    description: getPageDescription('Discover essential Nostr resources, tools, and services to enhance your decentralized social experience.'),
  });

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Globe className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold gradient-text">
              Discover Nostr Resources
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Essential tools, services, and gateways to enhance your Nostr experience.
            Explore the ecosystem with trusted resources for every need.
          </p>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <Card
              key={resource.name}
              className="group hover:shadow-lg transition-all duration-300 border-primary/20 hover:border-primary/40 bg-card/50 backdrop-blur-sm"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                      {resource.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {resource.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full border ${categoryColors[resource.category]}`}>
                          {resource.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {resource.description}
                </p>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  Visit Resource
                  <ExternalLink className="h-4 w-4" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="py-8">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Zap className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Community Powered</h3>
              </div>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                These resources are maintained by the Nostr community to help users discover and navigate the ecosystem.
                Each service operates independently and may have its own terms of service.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}