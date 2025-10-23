import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TagInput } from './TagInput';

describe('TagInput', () => {
  it('renders with default props', () => {
    const mockOnTagsChange = vi.fn();
    
    render(
      <TagInput
        tags={[]}
        onTagsChange={mockOnTagsChange}
      />
    );

    expect(screen.getByText('Tags (optional)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., social, messaging, tools')).toBeInTheDocument();
  });

  it('displays existing tags', () => {
    const mockOnTagsChange = vi.fn();
    const tags = ['social', 'messaging'];
    
    render(
      <TagInput
        tags={tags}
        onTagsChange={mockOnTagsChange}
      />
    );

    expect(screen.getByText('social')).toBeInTheDocument();
    expect(screen.getByText('messaging')).toBeInTheDocument();
  });

  it('adds a new tag when button is clicked', () => {
    const mockOnTagsChange = vi.fn();
    
    render(
      <TagInput
        tags={[]}
        onTagsChange={mockOnTagsChange}
      />
    );

    const input = screen.getByPlaceholderText('e.g., social, messaging, tools');
    const addButton = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'newtag' } });
    fireEvent.click(addButton);

    expect(mockOnTagsChange).toHaveBeenCalledWith(['newtag']);
  });

  it('adds a new tag when Enter is pressed', () => {
    const mockOnTagsChange = vi.fn();
    
    render(
      <TagInput
        tags={[]}
        onTagsChange={mockOnTagsChange}
      />
    );

    const input = screen.getByPlaceholderText('e.g., social, messaging, tools');

    fireEvent.change(input, { target: { value: 'newtag' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnTagsChange).toHaveBeenCalledWith(['newtag']);
  });

  it('removes a tag when X button is clicked', () => {
    const mockOnTagsChange = vi.fn();
    const tags = ['social', 'messaging'];
    
    render(
      <TagInput
        tags={tags}
        onTagsChange={mockOnTagsChange}
      />
    );

    // Find the X button for the 'social' tag
    const socialTag = screen.getByText('social').closest('.flex');
    const removeButton = socialTag?.querySelector('button');
    
    if (removeButton) {
      fireEvent.click(removeButton);
    }

    expect(mockOnTagsChange).toHaveBeenCalledWith(['messaging']);
  });

  it('normalizes tags to lowercase', () => {
    const mockOnTagsChange = vi.fn();
    
    render(
      <TagInput
        tags={[]}
        onTagsChange={mockOnTagsChange}
      />
    );

    const input = screen.getByPlaceholderText('e.g., social, messaging, tools');
    const addButton = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'UPPERCASE' } });
    fireEvent.click(addButton);

    expect(mockOnTagsChange).toHaveBeenCalledWith(['uppercase']);
  });
});