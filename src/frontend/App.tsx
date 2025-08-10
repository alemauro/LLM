import React, { useState } from 'react';
import Header from './components/Header';
import Modal from './components/Modal';
import PromptInput from './components/PromptInput';
import LLMResponseBox from './components/LLMResponseBox';
import { useStatistics } from './hooks/useStatistics';
import { useModels } from './hooks/useModels';
import { api } from './services/api';
import { fileAPI, UploadedFile } from './services/file.api';
import { DualLLMResponse } from './types';
import { getBestModelForFiles, canModelProcessFiles } from './utils/model-capabilities';

function App() {
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState<DualLLMResponse | null>(null);
  const [streamingResponses, setStreamingResponses] = useState<string[]>(['', '']);
  const [streamingFiles, setStreamingFiles] = useState<Array<{ name: string; type: 'image' | 'pdf' }>>();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [fileWarnings, setFileWarnings] = useState<string[]>([]);
  const [modelChangeNotifications, setModelChangeNotifications] = useState<string[]>([]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const useStreaming = true; // Always use streaming
  
  // Provider selection - now any provider can be in any box (2 boxes)
  const [providers, setProviders] = useState<Array<'openai' | 'gemini' | 'anthropic' | 'grok'>>(['openai', 'anthropic']);
  
  // Model configuration for each box (2 boxes)
  const [models, setModels] = useState<string[]>([
    'gpt-4o-mini-2024-07-18',     // Box 1 default (OpenAI)
    'claude-3-5-haiku-latest'      // Box 2 default (Anthropic)
  ]);
  
  // Temperature configuration for each box (2 boxes)
  const [temperatures, setTemperatures] = useState<number[]>([0.7, 0.7]);

  const { statistics, refetch: refetchStatistics } = useStatistics();
  const { openaiModels, geminiModels, anthropicModels, grokModels } = useModels();

  // Helper functions for managing providers and models
  const setProviderForBox = (boxIndex: number, provider: 'openai' | 'gemini' | 'anthropic' | 'grok') => {
    const newProviders = [...providers];
    newProviders[boxIndex] = provider;
    setProviders(newProviders);
    
    // Auto-select appropriate model for the new provider
    const newModels = [...models];
    switch (provider) {
      case 'openai':
        newModels[boxIndex] = openaiModels[0] || 'gpt-4o-mini-2024-07-18';
        break;
      case 'anthropic':
        newModels[boxIndex] = anthropicModels[0] || 'claude-3-5-haiku-latest';
        break;
      case 'gemini':
        newModels[boxIndex] = geminiModels[0] || 'gemini-2.0-flash-lite';
        break;
      case 'grok':
        newModels[boxIndex] = grokModels[0] || 'grok-2-vision-1212';
        break;
    }
    setModels(newModels);
  };

  const setModelForBox = (boxIndex: number, model: string) => {
    const newModels = [...models];
    newModels[boxIndex] = model;
    setModels(newModels);
  };

  const setTemperatureForBox = (boxIndex: number, temperature: number) => {
    const newTemperatures = [...temperatures];
    newTemperatures[boxIndex] = temperature;
    setTemperatures(newTemperatures);
  };

  const getModelsForProvider = (provider: 'openai' | 'gemini' | 'anthropic' | 'grok') => {
    switch (provider) {
      case 'openai': return openaiModels;
      case 'anthropic': return anthropicModels;
      case 'gemini': return geminiModels;
      case 'grok': return grokModels;
      default: return [];
    }
  };

  // Auto-adjust models when providers change and files are uploaded
  React.useEffect(() => {
    if (uploadedFiles.length === 0) return;
    
    // Convert UploadedFile[] to File[] for compatibility check
    const files = uploadedFiles.map(f => new File([], f.name, { type: f.type }));
    
    const notifications: string[] = [];
    const newModels = [...models];
    
    // Check each box's model compatibility
    providers.forEach((provider, index) => {
      const currentModel = models[index];
      const modelCheck = canModelProcessFiles(currentModel, files);
      
      if (!modelCheck.canProcess) {
        const bestModel = getBestModelForFiles(provider, files, currentModel);
        if (bestModel !== currentModel) {
          newModels[index] = bestModel;
          const providerName = provider === 'openai' ? 'OpenAI' : 
                               provider === 'anthropic' ? 'Anthropic' : 
                               provider === 'gemini' ? 'Gemini' : 'Grok';
          notifications.push(`📝 Box ${index + 1}: Cambiado modelo ${providerName} a ${bestModel} por compatibilidad con archivos`);
        }
      }
    });
    
    if (notifications.length > 0) {
      setModels(newModels);
      setModelChangeNotifications(notifications);
    }
  }, [providers, uploadedFiles]);

  const handleCancelGeneration = () => {
    if (abortController) {
      console.log('🛑 Cancelling generation...');
      setIsCancelling(true);
      abortController.abort();
      setAbortController(null);
      setLoading(false);
      setIsCancelling(false);
    }
  };

  const handlePromptSubmit = async (prompt: string, files?: File[]) => {
    // Cancel any existing generation
    if (abortController) {
      abortController.abort();
    }
    
    // Create new abort controller for this generation
    const newAbortController = new AbortController();
    setAbortController(newAbortController);
    
    setLoading(true);
    setIsCancelling(false);
    setResponses(null);
    setStreamingResponses(['', '']);
    setStreamingFiles(undefined);
    setFileWarnings([]);
    setModelChangeNotifications([]);
    
    let fileIds: string[] = [];
    
    // Upload files if provided
    if (files && files.length > 0) {
      try {
        const uploadResponse = await fileAPI.uploadFiles(files);
        if (uploadResponse.success && uploadResponse.data) {
          setUploadedFiles(uploadResponse.data.files);
          fileIds = uploadResponse.data.files.map(f => f.id);
          
          // Auto-select best models for uploaded files
          const notifications: string[] = [];
          
          // Check all boxes for best model compatibility
          const newModels = [...models];
          providers.forEach((provider, index) => {
            const bestModel = getBestModelForFiles(provider, files, models[index]);
            if (bestModel !== models[index]) {
              newModels[index] = bestModel;
              const providerName = provider === 'openai' ? 'OpenAI' : 
                                   provider === 'anthropic' ? 'Anthropic' : 
                                   provider === 'gemini' ? 'Gemini' : 'Grok';
              notifications.push(`📝 Box ${index + 1}: Auto-seleccionado modelo ${bestModel} para ${providerName} para mejor compatibilidad con archivos`);
            }
          });
          
          if (JSON.stringify(newModels) !== JSON.stringify(models)) {
            setModels(newModels);
          }
          
          setModelChangeNotifications(notifications);
          
          if (uploadResponse.data.errors && uploadResponse.data.errors.length > 0) {
            const errorMessages = uploadResponse.data.errors.map(e => `${e.file}: ${e.error}`);
            setFileWarnings(errorMessages);
          }
        } else {
          setFileWarnings([uploadResponse.error || 'Error al subir archivos']);
        }
      } catch (error: any) {
        console.error('File upload error:', error);
        setFileWarnings(['Error al subir archivos']);
      }
    }
    
    try {
      if (useStreaming) {
        // Streaming mode - handle 2 parallel streams
        console.log(`🔄 Using parallel streaming for ${providers.join(', ')}`);
        
        // Create stream promises for both boxes
        const streamPromises = providers.map((provider, index) => {
          const model = models[index];
          const temperature = temperatures[index];
          
          return api.streamResponse(
            {
              prompt,
              provider,
              model,
              temperature,
              fileIds: fileIds.length > 0 ? fileIds : undefined
            },
            {
              onFirstChunk: (chunk) => {
                setStreamingResponses(prev => {
                  const newResponses = [...prev];
                  newResponses[index] = newResponses[index] + chunk;
                  return newResponses;
                });
              },
              onFilesInfo: (files) => {
                if (index === 0) { // Only set files info once
                  setStreamingFiles(files);
                }
              },
              onError: (error) => {
                console.error(`${provider} (Box ${index + 1}) streaming error:`, error);
              }
            },
            newAbortController.signal
          );
        });
        
        // Wait for all streams to complete
        await Promise.all(streamPromises);
        refetchStatistics();
        setAbortController(null);
        setTimeout(() => setLoading(false), 500);
      } else {
        // Non-streaming mode - for backward compatibility, just use the first 2 boxes
        const response = await api.generateDualResponse({
          prompt,
          firstProvider: providers[0],
          secondProvider: providers[1],
          openaiModel: providers[0] === 'openai' ? models[0] : undefined,
          geminiModel: providers[0] === 'gemini' ? models[0] : undefined,
          anthropicModel: providers[1] === 'anthropic' ? models[1] : undefined,
          grokModel: providers[1] === 'grok' ? models[1] : undefined,
          openaiTemperature: providers[0] === 'openai' ? temperatures[0] : undefined,
          geminiTemperature: providers[0] === 'gemini' ? temperatures[0] : undefined,
          anthropicTemperature: providers[1] === 'anthropic' ? temperatures[1] : undefined,
          grokTemperature: providers[1] === 'grok' ? temperatures[1] : undefined,
          fileIds: fileIds.length > 0 ? fileIds : undefined
        }, newAbortController.signal);
        
        setResponses(response);
        refetchStatistics();
        setAbortController(null);
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error generating responses:', error);
      
      if (error.name === 'AbortError' || newAbortController.signal.aborted) {
        console.log('✅ Generation cancelled by user');
        setResponses({
          success: false,
          error: 'Generación cancelada por el usuario'
        });
      } else {
        setResponses({
          success: false,
          error: 'Error al generar las respuestas. Por favor, intenta de nuevo.'
        });
      }
      
      setAbortController(null);
      setLoading(false);
      setIsCancelling(false);
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
            onCancel={handleCancelGeneration}
            loading={loading}
            canCancel={!!abortController && !isCancelling}
          />

          <div className="responses-grid">
            {providers.map((provider, index) => (
              <LLMResponseBox
                key={index}
                provider={provider}
                availableProviders={['openai', 'anthropic', 'gemini', 'grok']}
                response={useStreaming 
                  ? streamingResponses[index] 
                  : (index === 0 ? responses?.data?.first.response || '' 
                    : index === 1 ? responses?.data?.second.response || '' 
                    : '')}
                model={models[index]}
                temperature={temperatures[index]}
                models={getModelsForProvider(provider)}
                loading={loading}
                attachedFiles={useStreaming ? streamingFiles : 
                  (index === 0 ? responses?.data?.first.attachedFiles : 
                   index === 1 ? responses?.data?.second.attachedFiles : undefined)}
                onProviderChange={(newProvider) => setProviderForBox(index, newProvider as 'openai' | 'anthropic' | 'gemini' | 'grok')}
                onModelChange={(model) => setModelForBox(index, model)}
                onTemperatureChange={(temp) => setTemperatureForBox(index, temp)}
              />
            ))}
          </div>

          {modelChangeNotifications.length > 0 && (
            <div className="file-status-message file-status-info">
              <strong>Modelos Auto-seleccionados:</strong>
              <ul style={{ marginTop: '0.5rem', marginLeft: '1rem' }}>
                {modelChangeNotifications.map((notification, index) => (
                  <li key={index}>{notification}</li>
                ))}
              </ul>
            </div>
          )}

          {fileWarnings.length > 0 && (
            <div className="file-status-message file-status-warning">
              <strong>Advertencias de archivos:</strong>
              <ul style={{ marginTop: '0.5rem', marginLeft: '1rem' }}>
                {fileWarnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

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
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#111827' }}>📋 Tecnología</h3>
          <p style={{ marginLeft: '0.5rem' }}>Aplicación web que permite comparar respuestas de diferentes modelos de lenguaje en tiempo real.</p>
        </div>
        
        <div className="modal-text">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#111827' }}>🤖 Modelos disponibles</h3>
          <ul style={{ marginLeft: '1.5rem' }}>
            <li><strong>OpenAI:</strong> GPT-4 Mini y GPT-3.5 Turbo</li>
            <li><strong>Gemini:</strong> Gemini 2.0 Flash y Flash Lite</li>
            <li><strong>Anthropic:</strong> Claude 3.5 Haiku y Claude 3.5 Sonnet</li>
            <li><strong>Grok:</strong> Grok 3 Mini Fast y Grok 2 Vision</li>
          </ul>
        </div>

        <div className="modal-text">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#111827' }}>✨ Funcionalidades</h3>
          <ul style={{ marginLeft: '1.5rem' }}>
            <li>Comparación simultánea de 2 respuestas LLM</li>
            <li>Cualquier proveedor puede ser seleccionado en cualquier caja</li>
            <li>Permite ejecutar el mismo modelo múltiples veces para comparar variaciones</li>
            <li>Selección dinámica de modelos y proveedores</li>
            <li>Ajuste de temperatura para controlar la creatividad</li>
            <li>Contador de prompts generados</li>
            <li>Soporte completo para archivos multimodales</li>
          </ul>
        </div>

        <div className="modal-text">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#111827' }}>⚙️ Configuración</h3>
          <p style={{ marginLeft: '0.5rem' }}>La temperatura controla la aleatoriedad de las respuestas (0 = más determinista, 1 = más creativo).</p>
        </div>

        <div className="modal-text" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem', marginTop: '1rem' }}>
          <p style={{ textAlign: 'center', fontStyle: 'italic', color: '#6b7280' }}>
            Creado por <strong style={{ color: '#111827' }}>Alejandro Mauro</strong> utilizando <strong style={{ color: '#2563eb' }}>Vibecoding</strong>
          </p>
        </div>
      </Modal>
    </div>
  );
}

export default App;