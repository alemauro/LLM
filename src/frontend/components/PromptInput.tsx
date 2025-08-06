import React, { useState } from 'react';
import FileUpload from './FileUpload';

interface PromptInputProps {
  onSubmit: (prompt: string, files?: File[]) => void;
  loading: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({ onSubmit, loading }) => {
  const [prompt, setPrompt] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !loading) {
      onSubmit(prompt, selectedFiles.length > 0 ? selectedFiles : undefined);
      // Clear files after submit
      setSelectedFiles([]);
      setShowFileUpload(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit(e as any);
    }
  };

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
  };

  return (
    <form onSubmit={handleSubmit} className="prompt-input-container">
      <div className="prompt-input-row">
        <label className="prompt-label">Prompt:</label>
        <div className="prompt-input-with-files">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe aquí tu prompt para los modelos de lenguaje..."
            className={`prompt-textarea ${selectedFiles.length > 0 ? 'prompt-with-files' : ''}`}
            rows={3}
            disabled={loading}
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
        <button
          type="button"
          onClick={() => {
            setPrompt('');
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