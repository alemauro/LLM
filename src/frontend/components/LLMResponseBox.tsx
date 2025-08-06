import React, { useState } from 'react';
import MarkdownRenderer from './SimpleMarkdownRenderer';

interface LLMResponseBoxProps {
  title: string;
  provider: 'openai' | 'anthropic';
  response: string;
  model: string;
  temperature: number;
  models: string[];
  loading: boolean;
  attachedFiles?: Array<{
    name: string;
    type: 'image' | 'pdf';
  }>;
  onModelChange: (model: string) => void;
  onTemperatureChange: (temperature: number) => void;
}

const LLMResponseBox: React.FC<LLMResponseBoxProps> = ({
  title,
  provider,
  response,
  model,
  temperature,
  models,
  loading,
  attachedFiles,
  onModelChange,
  onTemperatureChange
}) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const providerColors = {
    openai: 'border-green-500',
    anthropic: 'border-orange-500'
  };

  const providerBg = {
    openai: 'bg-green-50',
    anthropic: 'bg-orange-50'
  };

  const copyToClipboard = async () => {
    if (!response) return;
    
    try {
      await navigator.clipboard.writeText(response);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  const characterCount = response.length;

  return (
    <div className={`llm-response-box ${providerColors[provider]}`}>
      <div className={`llm-response-header ${providerBg[provider]}`}>
        <div className="header-top-row">
          <h3 className="llm-response-title">{title}</h3>
          <div className="header-actions">
            {(response || loading) && (
              <>
                <span className="char-count-compact">
                  {characterCount.toLocaleString()}
                </span>
                {response && (
                  <button
                    onClick={copyToClipboard}
                    className="copy-button-compact"
                    disabled={!response}
                    title="Copiar respuesta"
                  >
                    {copySuccess ? (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        <div className="llm-controls">
          <div className="control-group">
            <label className="control-label">Modelo:</label>
            <select 
              value={model}
              onChange={(e) => onModelChange(e.target.value)}
              className="model-select"
            >
              {models.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="control-group">
            <label className="control-label">Temperatura: {temperature}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
              className="temperature-slider"
            />
          </div>
        </div>
      </div>
      
      {attachedFiles && attachedFiles.length > 0 && (
        <div className="attached-files-section">
          <div className="attached-files-label">
            📎 Archivos analizados:
          </div>
          <div className="attached-files-list">
            {attachedFiles.map((file, index) => (
              <span key={index} className="attached-file-item">
                {file.type === 'image' ? '🖼️' : '📄'} {file.name}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <div className="llm-response-content">
        {response ? (
          <MarkdownRenderer 
            content={response}
            isStreaming={loading}
            className="response-markdown"
          />
        ) : loading ? (
          <div className="response-text">
            <span className="typing-cursor">▊</span>
          </div>
        ) : (
          <div className="empty-response">
            <p>Ingresa un prompt para ver la respuesta aquí</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LLMResponseBox;