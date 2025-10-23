import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { TestApp } from '@/test/TestApp';

describe('MarkdownRenderer', () => {
  it('renders inline code with relative font size', () => {
    const content = 'This is `inline code` in a paragraph.';
    render(
      <TestApp>
        <MarkdownRenderer content={content} />
      </TestApp>
    );
    
    const codeElement = screen.getByText('inline code');
    expect(codeElement).toHaveClass('text-[0.875em]');
    expect(codeElement).not.toHaveClass('text-sm');
  });

  it('renders inline code in headers with relative font size', () => {
    const content = '# Header with `inline code`';
    render(
      <TestApp>
        <MarkdownRenderer content={content} />
      </TestApp>
    );
    
    const codeElement = screen.getByText('inline code');
    expect(codeElement).toHaveClass('text-[0.875em]');
    expect(codeElement).not.toHaveClass('text-sm');
  });

  it('renders code blocks without inline styling', () => {
    const content = '```javascript\nconst x = 1;\n```';
    render(
      <TestApp>
        <MarkdownRenderer content={content} />
      </TestApp>
    );
    
    // Check that the code element has the hljs class (indicating it's a code block)
    const codeElement = document.querySelector('code.hljs');
    expect(codeElement).toBeTruthy();
    expect(codeElement).toHaveClass('hljs');
    expect(codeElement).not.toHaveClass('text-[0.875em]');
    expect(codeElement).not.toHaveClass('text-sm');
  });

  it('applies proper styling to inline code elements', () => {
    const content = 'Use the `useState` hook for state management.';
    render(
      <TestApp>
        <MarkdownRenderer content={content} />
      </TestApp>
    );
    
    const codeElement = screen.getByText('useState');
    expect(codeElement).toHaveClass('bg-primary/10');
    expect(codeElement).toHaveClass('text-accent');
    expect(codeElement).toHaveClass('px-1.5');
    expect(codeElement).toHaveClass('py-0.5');
    expect(codeElement).toHaveClass('rounded');
    expect(codeElement).toHaveClass('font-mono');
    expect(codeElement).toHaveClass('border');
    expect(codeElement).toHaveClass('border-primary/20');
    expect(codeElement).toHaveClass('text-[0.875em]');
  });

  it('renders blockquotes with proper contrast and styling', () => {
    const content = '> This is a quote block with better contrast.';
    render(
      <TestApp>
        <MarkdownRenderer content={content} />
      </TestApp>
    );
    
    const blockquoteElement = screen.getByText('This is a quote block with better contrast.');
    const blockquote = blockquoteElement.closest('blockquote');
    
    expect(blockquote).toHaveClass('border-l-4');
    expect(blockquote).toHaveClass('border-primary/30');
    expect(blockquote).toHaveClass('pl-4');
    expect(blockquote).toHaveClass('italic');
    expect(blockquote).toHaveClass('my-4');
    expect(blockquote).toHaveClass('text-foreground/90');
    expect(blockquote).toHaveClass('bg-muted/30');
    expect(blockquote).toHaveClass('py-2');
    expect(blockquote).toHaveClass('rounded-r-md');
  });
});