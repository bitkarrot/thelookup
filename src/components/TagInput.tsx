import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Plus, X, Tag } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  label?: string;
  placeholder?: string;
  description?: string;
}

export function TagInput({ 
  tags, 
  onTagsChange, 
  label = "Tags (optional)",
  placeholder = "e.g., social, messaging, tools",
  description = "Add tags to help users discover your content. Press Enter, comma, Tab, or space to add."
}: TagInputProps) {
  const { toast } = useToast();
  const [newTag, setNewTag] = useState('');

  const addTag = () => {
    const trimmedTag = newTag.trim().toLowerCase();
    
    // Validate that it's not empty
    if (!trimmedTag) return;
    
    // Check for valid tag format (alphanumeric, hyphens, underscores)
    if (!/^[a-z0-9_-]+$/.test(trimmedTag)) {
      toast({
        title: 'Invalid tag format',
        description: 'Tags can only contain lowercase letters, numbers, hyphens, and underscores',
        variant: 'destructive',
      });
      return;
    }
    
    // Check for reasonable length
    if (trimmedTag.length > 50) {
      toast({
        title: 'Tag too long',
        description: 'Tags must be 50 characters or less',
        variant: 'destructive',
      });
      return;
    }
    
    if (!tags.includes(trimmedTag)) {
      onTagsChange([...tags, trimmedTag]);
      setNewTag('');
    } else {
      toast({
        title: 'Tag already added',
        description: 'This tag is already added',
        variant: 'destructive',
      });
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(t => t !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center space-x-2">
        <Tag className="h-4 w-4" />
        <span>{label}</span>
      </Label>
      <div className="flex items-center space-x-2">
        <Input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab' || e.key === ' ') {
              e.preventDefault();
              addTag();
            }
          }}
        />
        <Button type="button" onClick={addTag} size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map(tag => (
            <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 hover:text-destructive flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}