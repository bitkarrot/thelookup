import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeaderWithAnchor } from './HeaderWithAnchor';

describe('HeaderWithAnchor', () => {
  it('renders header with anchor link', () => {
    render(
      <HeaderWithAnchor level={1} className="test-class">
        Test Header
      </HeaderWithAnchor>
    );

    const header = screen.getByRole('heading', { level: 1 });
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('test-class');
    expect(header).toHaveAttribute('id', 'test-header');

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '#test-header');
  });

  it('handles complex children with inline code', () => {
    render(
      <HeaderWithAnchor level={2}>
        Header with <code>inline code</code> and more text
      </HeaderWithAnchor>
    );

    const header = screen.getByRole('heading', { level: 2 });
    expect(header).toBeInTheDocument();
    expect(header).toHaveAttribute('id', 'header-with-inline-code-and-more-text');

    // Check that the content is properly wrapped
    const link = screen.getByRole('link');
    expect(link).toHaveClass('inline-flex');
    expect(link).toHaveClass('items-center');
    expect(link).toHaveClass('flex-wrap');
    expect(link).toHaveClass('gap-x-2');
  });

  it('uses flexible layout that works on mobile', () => {
    render(
      <HeaderWithAnchor level={3}>
        Very long header with <code>multiple</code> inline <code>code blocks</code> that should wrap properly
      </HeaderWithAnchor>
    );

    const link = screen.getByRole('link');
    
    // Check that the layout uses inline-flex instead of flex to avoid breaking
    expect(link).toHaveClass('inline-flex');
    expect(link).toHaveClass('flex-wrap');
    
    // Check that content is in a flexible container
    const contentSpan = link.querySelector('span');
    expect(contentSpan).toHaveClass('flex-1');
    expect(contentSpan).toHaveClass('min-w-0');
    
    // Check that the link icon is positioned properly
    const linkIcon = link.querySelector('svg');
    expect(linkIcon).toHaveClass('flex-shrink-0');
    expect(linkIcon).toHaveClass('-mt-0.5');
  });

  it('generates correct slugs for different header levels', () => {
    const { rerender } = render(
      <HeaderWithAnchor level={1}>
        Test Header
      </HeaderWithAnchor>
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute('id', 'test-header');

    rerender(
      <HeaderWithAnchor level={4}>
        Another Header with Special Characters!
      </HeaderWithAnchor>
    );

    expect(screen.getByRole('heading', { level: 4 })).toHaveAttribute('id', 'another-header-with-special-characters');
  });

  it('extracts text from complex nested children', () => {
    render(
      <HeaderWithAnchor level={2}>
        Complex <strong>nested</strong> <em>content</em> with <code>code</code>
      </HeaderWithAnchor>
    );

    const header = screen.getByRole('heading', { level: 2 });
    expect(header).toHaveAttribute('id', 'complex-nested-content-with-code');
  });
});