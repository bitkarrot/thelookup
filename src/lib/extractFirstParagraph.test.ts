import { describe, it, expect } from 'vitest';

// We need to extract the function for testing
function extractFirstParagraph(content: string, maxLength: number = 140): string {
  if (!content) return '';
  
  // Split into lines and filter out empty lines
  const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
    
    // Skip markdown headers (# ## ### etc)
    if (line.startsWith('#')) continue;
    
    // Skip setext-style headers (underlined with = or -)
    if (nextLine && (nextLine.match(/^=+$/) || nextLine.match(/^-+$/))) {
      i++; // Skip the next line too (the underline)
      continue;
    }
    
    // Skip horizontal rules
    if (line.match(/^[-*_]{3,}$/)) continue;
    
    // Skip code blocks
    if (line.startsWith('```')) continue;
    
    // Skip list items (- * +)
    if (line.match(/^[-*+]\s/)) continue;
    
    // Skip numbered lists
    if (line.match(/^\d+\.\s/)) continue;
    
    // Skip blockquotes
    if (line.startsWith('>')) continue;
    
    // Skip lines that are entirely inline code blocks (with possible whitespace)
    if (line.match(/^\s*(`[^`]*`\s*)+$/)) continue;
    
    // Skip lines that are just punctuation or special chars
    if (line.match(/^[^\w\s]*$/)) continue;
    
    // If we found a substantial line, use it
    if (line.length > 10) {
      // Remove markdown formatting
      let cleaned = line
        .replace(/\*\*(.*?)\*\*/g, '$1') // bold
        .replace(/\*(.*?)\*/g, '$1')     // italic
        .replace(/`(.*?)`/g, '$1')       // inline code
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // links
        .trim();
      
      // Truncate to maxLength
      if (cleaned.length > maxLength) {
        cleaned = cleaned.substring(0, maxLength).trim();
        // Try to break at a word boundary
        const lastSpace = cleaned.lastIndexOf(' ');
        if (lastSpace > maxLength * 0.7) {
          cleaned = cleaned.substring(0, lastSpace);
        }
        cleaned += '...';
      }
      
      return cleaned;
    }
  }
  
  // Fallback: just take the first maxLength characters
  const fallback = content.replace(/\n/g, ' ').trim();
  if (fallback.length > maxLength) {
    return fallback.substring(0, maxLength).trim() + '...';
  }
  return fallback;
}

describe('extractFirstParagraph', () => {
  it('extracts first paragraph skipping headers', () => {
    const content = '# Title\n\n## Subtitle\n\nThis is the first paragraph.\n\nThis is the second paragraph.';
    const result = extractFirstParagraph(content);
    expect(result).toBe('This is the first paragraph.');
  });

  it('skips list items and finds paragraph', () => {
    const content = '- Item 1\n- Item 2\n\nThis is a paragraph after the list.';
    const result = extractFirstParagraph(content);
    expect(result).toBe('This is a paragraph after the list.');
  });

  it('removes markdown formatting', () => {
    const content = 'This is **bold** and *italic* text with `code` and [link](url).';
    const result = extractFirstParagraph(content);
    expect(result).toBe('This is bold and italic text with code and link.');
  });

  it('truncates long content at word boundaries', () => {
    const content = 'This is a very long paragraph that should be truncated at a reasonable word boundary to ensure readability and proper formatting.';
    const result = extractFirstParagraph(content, 50);
    expect(result).toMatch(/\.\.\.$/);
    expect(result.length).toBeLessThanOrEqual(53); // 50 + "..."
    expect(result).not.toMatch(/\s\.\.\.$/); // Should not end with space before ellipsis
  });

  it('handles empty content', () => {
    const result = extractFirstParagraph('');
    expect(result).toBe('');
  });

  it('handles content with only headers', () => {
    const content = '# Title\n## Subtitle\n### Section';
    const result = extractFirstParagraph(content);
    expect(result).toBe('# Title ## Subtitle ### Section');
  });

  it('skips blockquotes', () => {
    const content = '> This is a quote\n\nThis is a regular paragraph.';
    const result = extractFirstParagraph(content);
    expect(result).toBe('This is a regular paragraph.');
  });

  it('skips numbered lists', () => {
    const content = '1. First item\n2. Second item\n\nThis is a paragraph.';
    const result = extractFirstParagraph(content);
    expect(result).toBe('This is a paragraph.');
  });

  it('skips code blocks', () => {
    const content = '```javascript\ncode here\n```\n\nThis is a paragraph.';
    const result = extractFirstParagraph(content);
    expect(result).toBe('This is a paragraph.');
  });

  it('skips setext-style headers with equals signs', () => {
    const content = 'Main Title\n=========\n\nThis is the first paragraph after the title.';
    const result = extractFirstParagraph(content);
    expect(result).toBe('This is the first paragraph after the title.');
  });

  it('skips setext-style headers with hyphens', () => {
    const content = 'Subtitle\n--------\n\nThis is the first paragraph after the subtitle.';
    const result = extractFirstParagraph(content);
    expect(result).toBe('This is the first paragraph after the subtitle.');
  });

  it('skips multiple setext-style headers', () => {
    const content = 'Main Title\n==========\n\nSubtitle\n--------\n\nThis is the actual content paragraph.';
    const result = extractFirstParagraph(content);
    expect(result).toBe('This is the actual content paragraph.');
  });

  it('handles mixed header styles', () => {
    const content = '# ATX Header\n\nSetext Header\n=============\n\n## Another ATX\n\nFinally, this is the paragraph content.';
    const result = extractFirstParagraph(content);
    expect(result).toBe('Finally, this is the paragraph content.');
  });

  it('skips lines that are entirely inline code blocks', () => {
    const content = '`some code`\n\n  `more code with spaces`  \n\nThis is the actual paragraph content.';
    const result = extractFirstParagraph(content);
    expect(result).toBe('This is the actual paragraph content.');
  });

  it('skips single word code blocks', () => {
    const content = '`variable`\n\n`function`\n\nThis is a description of the function.';
    const result = extractFirstParagraph(content);
    expect(result).toBe('This is a description of the function.');
  });

  it('does not skip lines with code blocks mixed with other text', () => {
    const content = 'Use the `variable` to store data.\n\nThis is another paragraph.';
    const result = extractFirstParagraph(content);
    expect(result).toBe('Use the variable to store data.');
  });

  it('skips lines with multiple inline code blocks', () => {
    const content = '`draft` `optional`\n\n`required` `deprecated`\n\nThis is the actual paragraph content.';
    const result = extractFirstParagraph(content);
    expect(result).toBe('This is the actual paragraph content.');
  });
});