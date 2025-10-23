import { useRef, useMemo } from 'react';
import Prism from 'prismjs';
// Remove the default theme import to prevent conflicts with our custom theme

// Import core languages first
import 'prismjs/components/prism-markup-templating';

// Import common languages
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-scala';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-toml';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-sass';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-makefile';

interface SyntaxHighlighterProps {
  code: string;
  language: string;
  showLineNumbers?: boolean;
  className?: string;
}

export function SyntaxHighlighter({
  code,
  language,
  showLineNumbers = false,
  className = ''
}: SyntaxHighlighterProps) {
  const codeRef = useRef<HTMLElement>(null);

  // Map some common language aliases
  const normalizeLanguage = (lang: string): string => {
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'py': 'python',
      'rb': 'ruby',
      'sh': 'bash',
      'yml': 'yaml',
      'dockerfile': 'docker',
      'makefile': 'makefile',
      'md': 'markdown'
    };

    return languageMap[lang] || lang;
  };

  const normalizedLanguage = normalizeLanguage(language);

  // Memoize the highlighted HTML to prevent unnecessary re-highlighting
  const highlightedCode = useMemo(() => {
    try {
      // Check if the language is supported by Prism
      if (Prism.languages[normalizedLanguage]) {
        return Prism.highlight(code, Prism.languages[normalizedLanguage], normalizedLanguage);
      } else {
        // Fallback to plain text if language is not supported
        return code;
      }
    } catch (error) {
      console.warn('Syntax highlighting failed:', error);
      return code;
    }
  }, [code, normalizedLanguage]);

  // Generate line numbers if needed
  const lineNumbers = useMemo(() => {
    if (!showLineNumbers) return null;

    const lines = code.split('\n');
    return (
      <span className="line-numbers-rows">
        {lines.map((_, index) => (
          <span key={index}></span>
        ))}
      </span>
    );
  }, [code, showLineNumbers]);

  return (
    <div className={`relative ${className}`}>
      <pre className={`${showLineNumbers ? 'line-numbers' : ''} !bg-muted/30 !border-0 !rounded-lg !p-4 !text-sm !font-mono overflow-auto syntax-highlighter`}>
        {showLineNumbers && lineNumbers}
        <code
          ref={codeRef}
          className={`language-${normalizedLanguage}`}
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </pre>
    </div>
  );
}