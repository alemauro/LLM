import React, { useState } from 'react';
import Header from './components/Header';
import Modal from './components/Modal';
import PromptInput from './components/PromptInput';
import LLMResponseBox from './components/LLMResponseBox';
import { useStatistics } from './hooks/useStatistics';
import { useModels } from './hooks/useModels';
import { api } from './services/api';
import { DualLLMResponse } from './types';

function App() {
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState<DualLLMResponse | null>(null);
  const [streamingResponses, setStreamingResponses] = useState<{ openai: string; anthropic: string }>({ openai: '', anthropic: '' });
  const useStreaming = true; // Always use streaming
  
  // Configuración de modelos y temperaturas
  const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini-2024-07-18');
  const [anthropicModel, setAnthropicModel] = useState('claude-3-5-haiku-latest');
  const [openaiTemperature, setOpenaiTemperature] = useState(0.7);
  const [anthropicTemperature, setAnthropicTemperature] = useState(0.7);

  const { statistics, refetch: refetchStatistics } = useStatistics();
  const { openaiModels, anthropicModels } = useModels();

  const handlePromptSubmit = async (prompt: string) => {
    setLoading(true);
    setResponses(null);
    setStreamingResponses({ openai: '', anthropic: '' });
    
    try {
      if (useStreaming) {
        // Modo streaming
        await api.streamResponse(
          {
            prompt,
            provider: 'dual',
            openaiModel,
            anthropicModel,
            openaiTemperature,
            anthropicTemperature
          },
          {
            onOpenAIChunk: (chunk) => {
              setStreamingResponses(prev => ({ ...prev, openai: prev.openai + chunk }));
            },
            onAnthropicChunk: (chunk) => {
              setStreamingResponses(prev => ({ ...prev, anthropic: prev.anthropic + chunk }));
            },
            onError: (error) => {
              console.error('Streaming error:', error);
              setResponses({
                success: false,
                error: `Error en streaming: ${error}`
              });
            },
            onComplete: () => {
              refetchStatistics();
              // Pequeño delay para mostrar el cursor al final
              setTimeout(() => setLoading(false), 500);
            }
          }
        );
      } else {
        // Modo normal (sin streaming)
        const response = await api.generateDualResponse({
          prompt,
          openaiModel,
          anthropicModel,
          openaiTemperature,
          anthropicTemperature
        });
        
        setResponses(response);
        refetchStatistics();
        setLoading(false);
      }
    } catch (error) {
      console.error('Error generating responses:', error);
      setResponses({
        success: false,
        error: 'Error al generar las respuestas. Por favor, intenta de nuevo.'
      });
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <Header 
        statistics={statistics}
        onShowAboutModal={() => setShowAboutModal(true)}
      />

      <main className="main-content">
        <div className="container">
          <PromptInput 
            onSubmit={handlePromptSubmit}
            loading={loading}
          />

          <div className="responses-grid">
            <LLMResponseBox
              title="OpenAI"
              provider="openai"
              response={useStreaming ? streamingResponses.openai : (responses?.data?.openai.response || '')}
              model={openaiModel}
              temperature={openaiTemperature}
              models={openaiModels}
              loading={loading}
              onModelChange={setOpenaiModel}
              onTemperatureChange={setOpenaiTemperature}
            />

            <LLMResponseBox
              title="Anthropic"
              provider="anthropic"
              response={useStreaming ? streamingResponses.anthropic : (responses?.data?.anthropic.response || '')}
              model={anthropicModel}
              temperature={anthropicTemperature}
              models={anthropicModels}
              loading={loading}
              onModelChange={setAnthropicModel}
              onTemperatureChange={setAnthropicTemperature}
            />
          </div>

          {responses?.error && (
            <div className="error-message">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {responses.error}
            </div>
          )}
        </div>
      </main>

      <Modal 
        isOpen={showAboutModal} 
        onClose={() => setShowAboutModal(false)} 
        title="Grandes Modelos de Lenguaje (Infomed-GURU)"
      >
        <div className="modal-text">
          <p><strong>Tecnología:</strong> Aplicación web que permite comparar respuestas de diferentes modelos de lenguaje en tiempo real.</p>
          <p><strong>Modelos disponibles:</strong></p>
          <ul>
            <li>OpenAI: GPT-4 Mini y GPT-3.5 Turbo</li>
            <li>Anthropic: Claude 3.5 Haiku y Claude 3.5 Sonnet</li>
          </ul>
          <p><strong>Fecha de creación:</strong> 5 de Agosto de 2025 (creado por Alejandro Mauro)</p>
          <p><strong>Funcionalidades:</strong></p>
          <ul>
            <li>Comparación simultánea de respuestas de dos LLM</li>
            <li>Selección dinámica de modelos</li>
            <li>Ajuste de temperatura para controlar la creatividad</li>
            <li>Contador de prompts generados</li>
            <li>Interfaz bilingüe optimizada</li>
          </ul>
        </div>
        <div className="modal-text">
          <p><strong>Configuración:</strong></p>
          <p>La temperatura controla la aleatoriedad de las respuestas (0 = más determinista, 1 = más creativo).</p>
        </div>
      </Modal>
    </div>
  );
}

export default App;