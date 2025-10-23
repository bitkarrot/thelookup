import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import type { OfficialNip } from '@/hooks/useOfficialNips';

interface OfficialNipCardProps {
  nip: OfficialNip;
  /** Maximum number of kinds to display before showing "+X more" */
  maxKinds?: number;
  /** Additional CSS classes */
  className?: string;
}

export function OfficialNipCard({ 
  nip, 
  maxKinds = 2, 
  className = "" 
}: OfficialNipCardProps) {
  const navigate = useNavigate();
  
  return (
    <Card className={`glass border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 group h-full ${className}`}>
      <Link to={`/${nip.number}`} className="block h-full">
        <CardContent className="p-3 sm:p-4 card-content h-full flex flex-col">
          <div className="space-y-2 sm:space-y-3 flex flex-col h-full">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-primary group-hover:text-accent transition-colors text-sm sm:text-base leading-tight flex-1 min-w-0">
                NIP-{nip.number}
              </h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                  Official
                </Badge>
                {nip.deprecated && (
                  <Badge variant="destructive" className="text-xs">
                    Deprecated
                  </Badge>
                )}
              </div>
            </div>
            
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed flex-1">
              {nip.title}
            </p>
            
            {nip.note && (
              <p className="text-xs text-muted-foreground/80 italic">
                {nip.note}
              </p>
            )}
            
            {nip.eventKinds && nip.eventKinds.length > 0 && (
              <div className="flex items-center flex-wrap gap-1">
                <span className="text-xs text-muted-foreground flex-shrink-0">Kinds:</span>
                {nip.eventKinds.slice(0, maxKinds).map(eventKind => (
                  <Badge 
                    key={eventKind.kind} 
                    variant="secondary" 
                    className="text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(`/kind/${eventKind.kind}`);
                    }}
                  >
                    {eventKind.kind}
                  </Badge>
                ))}
                {nip.eventKinds.length > maxKinds && (
                  <span className="text-xs text-muted-foreground">+{nip.eventKinds.length - maxKinds} more</span>
                )}
              </div>
            )}
            
            <div className="flex items-center justify-between min-w-0 mt-auto">
              <span className="text-xs text-muted-foreground/60 flex-shrink-0">
                Official Protocol
              </span>
              <button
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(`https://github.com/nostr-protocol/nips/blob/master/${nip.number}.md`, '_blank');
                }}
              >
                <ExternalLink className="h-3 w-3" />
                GitHub
              </button>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}