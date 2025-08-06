import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
// import rehype-highlight - we'll handle syntax highlighting manually with Prism
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import 'katex/dist/katex.min.css';

// Import PrismJS core and theme
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';

// Import PrismJS languages for syntax highlighting
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-shell-session';

// Extend window interface for Prism
declare global {
  interface Window {
    Prism: typeof Prism;
  }
}

// Make Prism available globally
if (typeof window !== 'undefined') {
  window.Prism = Prism;
}

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
  className?: string;
}

interface CodeBlockProps {
  children: string;
  className?: string;
  inline?: boolean;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ children, className, inline }) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying code:', err);
    }
  }, [children]);

  // Extract language from className (format: language-xxx)
  const language = className ? className.replace('language-', '') : '';
  
  // Apply syntax highlighting after render
  useEffect(() => {
    if (codeRef.current && language && window.Prism && window.Prism.languages[language]) {
      const highlighted = window.Prism.highlight(children, window.Prism.languages[language], language);
      codeRef.current.innerHTML = highlighted;
    }
  }, [children, language]);
  
  if (inline) {
    return <code className="inline-code">{children}</code>;
  }

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        {language && (
          <span className="code-language">{language}</span>
        )}
        <button
          onClick={handleCopy}
          className="copy-code-button"
          title="Copiar código"
        >
          {copied ? (
            <svg className="copy-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="copy-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>
      <pre className={className}>
        <code ref={codeRef} className={className}>
          {children}
        </code>
      </pre>
    </div>
  );
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  isStreaming = false, 
  className = '' 
}) => {
  const [displayContent, setDisplayContent] = useState('');

  useEffect(() => {
    if (isStreaming) {
      // Streaming animation effect - reveal content gradually
      setDisplayContent(content);
    } else {
      setDisplayContent(content);
    }
  }, [content, isStreaming]);

  // No need for global highlighting - handled individually by CodeBlock components

  // Custom sanitization schema that allows KaTeX elements
  const sanitizeSchema = {
    ...defaultSchema,
    tagNames: [
      ...defaultSchema.tagNames!,
      'math', 'semantics', 'mrow', 'mo', 'mi', 'mn', 'mtext',
      'mspace', 'mover', 'munder', 'munderover', 'msub', 'msup', 'msubsup',
      'mfrac', 'msqrt', 'mroot', 'mtable', 'mtr', 'mtd', 'annotation'
    ],
    attributes: {
      ...defaultSchema.attributes,
      '*': [...(defaultSchema.attributes!['*'] || []), 'className', 'style'],
      'math': ['xmlns'],
      'semantics': ['*'],
      'annotation': ['encoding']
    }
  };

  const components = {
    code: CodeBlock,
    // Custom table styling
    table: ({ children, ...props }: any) => (
      <div className="table-wrapper">
        <table className="markdown-table" {...props}>
          {children}
        </table>
      </div>
    ),
    // Custom blockquote styling
    blockquote: ({ children, ...props }: any) => (
      <blockquote className="markdown-blockquote" {...props}>
        {children}
      </blockquote>
    ),
    // Custom link styling with security
    a: ({ children, href, ...props }: any) => (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="markdown-link"
        {...props}
      >
        {children}
      </a>
    )
  };

  return (
    <div className={`markdown-renderer ${className} ${isStreaming ? 'streaming' : ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          [rehypeSanitize, sanitizeSchema],
          rehypeKatex
        ]}
        components={components}
      >
        {displayContent}
      </ReactMarkdown>
      {isStreaming && (
        <span className="streaming-cursor">▊</span>
      )}
    </div>
  );
};

export default MarkdownRenderer;