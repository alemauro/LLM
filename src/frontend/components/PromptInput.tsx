import React, { useState, useRef, useEffect } from 'react';
import FileUpload from './FileUpload';

interface PromptInputProps {
  onSubmit: (prompt: string, files?: File[]) => void;
  onCancel?: () => void;
  loading: boolean;
  canCancel?: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({ onSubmit, onCancel, loading, canCancel }) => {
  const [prompt, setPrompt] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const isComposing = useRef(false);
  const lastCursorPosition = useRef(0);

  // Auto-focus on mount
  useEffect(() => {
    contentEditableRef.current?.focus();
  }, []);

  // Apply syntax highlighting
  const applyHighlighting = (text: string): string => {
    // Escape HTML to prevent XSS
    const escapeHtml = (str: string) => {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };

    // First escape the entire text
    let highlightedText = escapeHtml(text);
    
    // Pattern to match INSTRUCCIÓN/INSTRUCCION, CONTEXTO, INPUT, OUTPUT with variations
    // Handle triple quotes first, then double, then single quotes
    // Use separate patterns for better control
    const patterns = [
      // Triple quotes (can be empty or with content)
      /(INSTRUCCI[ÓO]N|CONTEXTO|INPUT|OUTPUT)(\s*)(=)(\s*)("""|''')([\s\S]*?)\5/gi,
      // Double quotes
      /(INSTRUCCI[ÓO]N|CONTEXTO|INPUT|OUTPUT)(\s*)(=)(\s*)(")((?:[^"\\]|\\.)*)"/gi,
      // Single quotes
      /(INSTRUCCI[ÓO]N|CONTEXTO|INPUT|OUTPUT)(\s*)(=)(\s*)(')((?:[^'\\]|\\.)*)'/gi
    ];
    
    patterns.forEach(pattern => {
      highlightedText = highlightedText.replace(pattern, (match, keyword, space1, equals, space2, quotes, content) => {
        const keywordColor = getKeywordColor(keyword.toUpperCase().replace('Ó', 'O'));
        const contentHtml = content ? 
          `<span style="color: #1e40af; background-color: rgba(59, 130, 246, 0.08); padding: 0 2px; border-radius: 2px;">${content}</span>` : 
          '';
        return `<span style="color: ${keywordColor}; font-weight: 700;">${keyword}</span>${space1}<span style="color: #6b7280;">${equals}</span>${space2}<span style="color: #059669;">${quotes}</span>${contentHtml}<span style="color: #059669;">${quotes}</span>`;
      });
    });
    
    return highlightedText;
  };

  const getKeywordColor = (keyword: string): string => {
    switch(keyword) {
      case 'INSTRUCCION': return '#dc2626';
      case 'CONTEXTO': return '#7c2d12';
      case 'INPUT': return '#1e40af';
      case 'OUTPUT': return '#6d28d9';
      default: return '#111827';
    }
  };

  // Get cursor position
  const getCursorPosition = (): number => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 0;
    
    const range = selection.getRangeAt(0);
    const clonedRange = range.cloneRange();
    
    if (contentEditableRef.current) {
      clonedRange.selectNodeContents(contentEditableRef.current);
      clonedRange.setEnd(range.endContainer, range.endOffset);
      return clonedRange.toString().length;
    }
    
    return 0;
  };

  // Set cursor position
  const setCursorPosition = (position: number) => {
    if (!contentEditableRef.current) return;
    
    const selection = window.getSelection();
    if (!selection) return;
    
    let charCount = 0;
    const stack: { node: Node, charCount: number }[] = [{ node: contentEditableRef.current, charCount: 0 }];
    let foundNode: Node | null = null;
    let foundOffset = 0;
    
    // Find the text node and offset for the position
    while (stack.length > 0 && !foundNode) {
      const { node } = stack.pop()!;
      
      if (node.nodeType === Node.TEXT_NODE) {
        const nodeLength = node.textContent?.length || 0;
        if (charCount + nodeLength >= position) {
          foundNode = node;
          foundOffset = position - charCount;
        } else {
          charCount += nodeLength;
        }
      } else if (node.childNodes) {
        // Add child nodes to stack in reverse order
        for (let i = node.childNodes.length - 1; i >= 0; i--) {
          stack.push({ node: node.childNodes[i], charCount });
        }
      }
    }
    
    // Set the cursor position
    if (foundNode) {
      try {
        const range = document.createRange();
        range.setStart(foundNode, Math.min(foundOffset, foundNode.textContent?.length || 0));
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      } catch (e) {
        // Fallback to end of content
        selection.selectAllChildren(contentEditableRef.current);
        selection.collapseToEnd();
      }
    } else {
      // Fallback to end of content
      selection.selectAllChildren(contentEditableRef.current);
      selection.collapseToEnd();
    }
  };

  // Handle content change with delayed highlighting
  const handleInput = () => {
    if (!contentEditableRef.current || isComposing.current) return;
    
    const text = contentEditableRef.current.innerText || '';
    setPrompt(text);
    
    // Store cursor position
    lastCursorPosition.current = getCursorPosition();
    
    // Apply highlighting with a delay to avoid cursor jumping
    requestAnimationFrame(() => {
      if (!contentEditableRef.current) return;
      
      const currentText = contentEditableRef.current.innerText || '';
      if (currentText === text) {
        contentEditableRef.current.innerHTML = applyHighlighting(text);
        setCursorPosition(lastCursorPosition.current);
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !loading) {
      onSubmit(prompt, selectedFiles.length > 0 ? selectedFiles : undefined);
      // Clear files after submit
      setSelectedFiles([]);
      setShowFileUpload(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      if (e.ctrlKey) {
        // Ctrl+Enter to submit
        e.preventDefault();
        handleSubmit(e as any);
      } else {
        // Regular Enter to insert line break
        e.preventDefault();
        
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          
          // Insert a line break
          const br = document.createElement('br');
          range.insertNode(br);
          
          // Move cursor after the line break
          range.setStartAfter(br);
          range.setEndAfter(br);
          selection.removeAllRanges();
          selection.addRange(range);
          
          // Trigger input handler to update state
          setTimeout(() => handleInput(), 0);
        }
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    
    // Insert text at cursor position
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      
      // Move cursor to end of inserted text
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    // Trigger input handler
    setTimeout(() => handleInput(), 0);
  };

  const handleCompositionStart = () => {
    isComposing.current = true;
  };

  const handleCompositionEnd = () => {
    isComposing.current = false;
    handleInput();
  };

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
  };

  return (
    <form onSubmit={handleSubmit} className="prompt-input-container">
      <div className="prompt-input-row">
        <label className="prompt-label">User Prompt:</label>
        <div className="prompt-input-with-files">
          <div 
            ref={contentEditableRef}
            contentEditable={!loading}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            className="prompt-editable"
            data-placeholder="Ingresa tu prompt aquí..."
            suppressContentEditableWarning={true}
            style={{
              minHeight: '160px',
              maxHeight: '400px',
              overflowY: 'auto',
            }}
          />
          {selectedFiles.length > 0 && (
            <span className="files-attached-indicator">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              {selectedFiles.length} archivo{selectedFiles.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      
      {showFileUpload && (
        <FileUpload
          onFilesSelected={handleFilesSelected}
          maxFiles={5}
          maxSizeMB={20}
        />
      )}
      
      <div className="prompt-actions">
        <button
          type="submit"
          disabled={!prompt.trim() || loading}
          className="submit-button"
        >
          {loading ? 'Generando...' : 'Generar'}
        </button>
        
        {loading && canCancel && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="cancel-button"
          >
            🛑 Cancelar
          </button>
        )}
        
        <button
          type="button"
          onClick={() => {
            setPrompt('');
            if (contentEditableRef.current) {
              contentEditableRef.current.innerHTML = '';
            }
            setSelectedFiles([]);
            setShowFileUpload(false);
          }}
          disabled={loading}
          className="clear-button"
        >
          Limpiar
        </button>
        <button
          type="button"
          onClick={() => setShowFileUpload(!showFileUpload)}
          disabled={loading}
          className="file-button"
          title="Subir imágenes o PDFs"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          {showFileUpload ? 'Ocultar' : 'Adjuntar'}
        </button>
        <span className="prompt-hint">Tip: Ctrl+Enter para enviar</span>
      </div>
    </form>
  );
};

export default PromptInput;