import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SyntaxHighlighter } from './SyntaxHighlighter';

describe('SyntaxHighlighter', () => {
  it('renders code with syntax highlighting', () => {
    const code = 'const hello = "world";';
    const { container } = render(
      <SyntaxHighlighter
        code={code}
        language="javascript"
      />
    );

    const codeElement = container.querySelector('code');
    expect(codeElement).toBeInTheDocument();
    expect(codeElement).toHaveClass('language-javascript');

    // Check that syntax highlighting tokens are present
    const keywordToken = container.querySelector('.token.keyword');
    expect(keywordToken).toBeInTheDocument();
    expect(keywordToken).toHaveTextContent('const');
  });

  it('renders line numbers when enabled', () => {
    const code = 'line 1\nline 2\nline 3';
    const { container } = render(
      <SyntaxHighlighter
        code={code}
        language="text"
        showLineNumbers={true}
      />
    );

    const preElement = container.querySelector('pre');
    expect(preElement).toHaveClass('line-numbers');

    const lineNumbersRows = container.querySelector('.line-numbers-rows');
    expect(lineNumbersRows).toBeInTheDocument();

    // Should have 3 line number spans for 3 lines
    const lineSpans = container.querySelectorAll('.line-numbers-rows > span');
    expect(lineSpans).toHaveLength(3);
  });

  it('normalizes language aliases correctly', () => {
    const code = 'const test = true;';
    const { container } = render(
      <SyntaxHighlighter
        code={code}
        language="js"
      />
    );

    const codeElement = container.querySelector('code');
    expect(codeElement).toHaveClass('language-javascript');
  });

  it('applies custom CSS class', () => {
    const code = 'test';
    const customClass = 'custom-highlighter';

    const { container } = render(
      <SyntaxHighlighter
        code={code}
        language="text"
        className={customClass}
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass(customClass);
  });

  it('handles unsupported languages gracefully', () => {
    const code = 'some code';
    const { container } = render(
      <SyntaxHighlighter
        code={code}
        language="unsupported-language"
      />
    );

    const codeElement = container.querySelector('code');
    expect(codeElement).toBeInTheDocument();
    expect(codeElement).toHaveClass('language-unsupported-language');
    expect(codeElement).toHaveTextContent(code);
  });
});