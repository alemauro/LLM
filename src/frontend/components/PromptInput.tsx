import React, { useState } from 'react';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  loading: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({ onSubmit, loading }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !loading) {
      onSubmit(prompt);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit(e as any);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="prompt-input-container">
      <div className="prompt-input-row">
        <label className="prompt-label">Prompt:</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe aquí tu prompt para los modelos de lenguaje..."
          className="prompt-textarea"
          rows={3}
          disabled={loading}
        />
      </div>
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
          onClick={() => setPrompt('')}
          disabled={loading}
          className="clear-button"
        >
          Limpiar
        </button>
        <span className="prompt-hint">Tip: Ctrl+Enter para enviar</span>
      </div>
    </form>
  );
};

export default PromptInput;