import React, { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import 'katex/dist/katex.min.css';

interface SimpleMarkdownRendererProps {
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
      <pre className={`code-block ${className || ''}`}>
        <code className={className}>
          {children}
        </code>
      </pre>
    </div>
  );
};

const SimpleMarkdownRenderer: React.FC<SimpleMarkdownRendererProps> = ({ 
  content, 
  isStreaming = false, 
  className = '' 
}) => {
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
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span className="streaming-cursor">▊</span>
      )}
    </div>
  );
};

export default SimpleMarkdownRenderer;