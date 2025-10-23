import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface KindInputProps {
  kinds: string[];
  onKindsChange: (kinds: string[]) => void;
  label?: string;
  placeholder?: string;
}

export function KindInput({ 
  kinds, 
  onKindsChange, 
  label = "Event Kinds (optional)",
  placeholder = "e.g., 30000"
}: KindInputProps) {
  const { toast } = useToast();
  const [newKind, setNewKind] = useState('');

  const addKind = () => {
    const trimmedKind = newKind.trim();
    
    // Validate that it's a number
    if (!trimmedKind) return;
    
    const kindNumber = parseInt(trimmedKind, 10);
    if (isNaN(kindNumber) || kindNumber < 0 || !Number.isInteger(Number(trimmedKind))) {
      toast({
        title: 'Invalid event kind',
        description: 'Event kind must be a valid non-negative integer',
        variant: 'destructive',
      });
      return;
    }
    
    const kindString = kindNumber.toString();
    if (!kinds.includes(kindString)) {
      onKindsChange([...kinds, kindString]);
      setNewKind('');
    } else {
      toast({
        title: 'Event kind already added',
        variant: 'destructive',
      });
    }
  };

  const removeKind = (kindToRemove: string) => {
    onKindsChange(kinds.filter(k => k !== kindToRemove));
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center space-x-2">
        <Input
          value={newKind}
          onChange={(e) => setNewKind(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab' || e.key === ' ') {
              e.preventDefault();
              addKind();
            }
          }}
        />
        <Button type="button" onClick={addKind} size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {kinds.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {kinds.map(kind => (
            <Badge key={kind} variant="secondary" className="flex items-center space-x-1">
              <span>{kind}</span>
              <button
                type="button"
                onClick={() => removeKind(kind)}
                className="ml-1 hover:text-destructive flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Add event kinds that this NIP defines or relates to. Press Enter, comma, Tab, or space to add. Must be valid numbers.
      </p>
    </div>
  );
}