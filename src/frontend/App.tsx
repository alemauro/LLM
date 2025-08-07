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
  const [streamingResponses, setStreamingResponses] = useState<{ first: string; second: string }>({ first: '', second: '' });
  const [streamingFiles, setStreamingFiles] = useState<Array<{ name: string; type: 'image' | 'pdf' }>>();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [fileWarnings, setFileWarnings] = useState<string[]>([]);
  const [modelChangeNotifications, setModelChangeNotifications] = useState<string[]>([]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const useStreaming = true; // Always use streaming
  
  // Provider selection
  const [firstProvider, setFirstProvider] = useState<'openai' | 'gemini'>('openai');
  const [secondProvider, setSecondProvider] = useState<'anthropic' | 'grok'>('anthropic');
  
  // Model configuration
  const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini-2024-07-18');
  const [geminiModel, setGeminiModel] = useState('gemini-2.0-flash-lite');
  const [anthropicModel, setAnthropicModel] = useState('claude-3-5-haiku-latest');
  const [grokModel, setGrokModel] = useState('grok-2-vision-1212');
  
  // Temperature configuration
  const [openaiTemperature, setOpenaiTemperature] = useState(0.7);
  const [geminiTemperature, setGeminiTemperature] = useState(0.7);
  const [anthropicTemperature, setAnthropicTemperature] = useState(0.7);
  const [grokTemperature, setGrokTemperature] = useState(0.7);

  const { statistics, refetch: refetchStatistics } = useStatistics();
  const { openaiModels, geminiModels, anthropicModels, grokModels } = useModels();

  // Auto-adjust models when providers change and files are uploaded
  React.useEffect(() => {
    if (uploadedFiles.length === 0) return;
    
    // Convert UploadedFile[] to File[] for compatibility check
    const files = uploadedFiles.map(f => new File([], f.name, { type: f.type }));
    
    const notifications: string[] = [];
    
    // Check first provider model compatibility
    const currentFirstModel = firstProvider === 'openai' ? openaiModel : geminiModel;
    const firstModelCheck = canModelProcessFiles(currentFirstModel, files);
    
    if (!firstModelCheck.canProcess) {
      const bestFirstModel = getBestModelForFiles(firstProvider, files, currentFirstModel);
      if (bestFirstModel !== currentFirstModel) {
        if (firstProvider === 'openai') {
          setOpenaiModel(bestFirstModel);
        } else {
          setGeminiModel(bestFirstModel);
        }
        notifications.push(`📝 Cambiado modelo ${firstProvider === 'openai' ? 'OpenAI' : 'Gemini'} a ${bestFirstModel} por compatibilidad con archivos`);
      }
    }
    
    // Check second provider model compatibility  
    const currentSecondModel = secondProvider === 'anthropic' ? anthropicModel : grokModel;
    const secondModelCheck = canModelProcessFiles(currentSecondModel, files);
    
    if (!secondModelCheck.canProcess) {
      const bestSecondModel = getBestModelForFiles(secondProvider, files, currentSecondModel);
      if (bestSecondModel !== currentSecondModel) {
        if (secondProvider === 'anthropic') {
          setAnthropicModel(bestSecondModel);
        } else {
          setGrokModel(bestSecondModel);
        }
        notifications.push(`📝 Cambiado modelo ${secondProvider === 'anthropic' ? 'Anthropic' : 'Grok'} a ${bestSecondModel} por compatibilidad con archivos`);
      }
    }
    
    if (notifications.length > 0) {
      setModelChangeNotifications(notifications);
    }
  }, [firstProvider, secondProvider, uploadedFiles]);

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
    setStreamingResponses({ first: '', second: '' });
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
          
          // Check first provider model
          const bestFirstModel = getBestModelForFiles(firstProvider, files, 
            firstProvider === 'openai' ? openaiModel : geminiModel);
          const currentFirstModel = firstProvider === 'openai' ? openaiModel : geminiModel;
          
          if (bestFirstModel !== currentFirstModel) {
            if (firstProvider === 'openai') {
              setOpenaiModel(bestFirstModel);
            } else {
              setGeminiModel(bestFirstModel);
            }
            notifications.push(`📝 Auto-seleccionado modelo ${bestFirstModel} para ${firstProvider === 'openai' ? 'OpenAI' : 'Gemini'} para mejor compatibilidad con archivos`);
          }
          
          // Check second provider model
          const bestSecondModel = getBestModelForFiles(secondProvider, files, 
            secondProvider === 'anthropic' ? anthropicModel : grokModel);
          const currentSecondModel = secondProvider === 'anthropic' ? anthropicModel : grokModel;
          
          if (bestSecondModel !== currentSecondModel) {
            if (secondProvider === 'anthropic') {
              setAnthropicModel(bestSecondModel);
            } else {
              setGrokModel(bestSecondModel);
            }
            notifications.push(`📝 Auto-seleccionado modelo ${bestSecondModel} para ${secondProvider === 'anthropic' ? 'Anthropic' : 'Grok'} para mejor compatibilidad con archivos`);
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
      // Check if streaming dual mode is supported for the current provider combination
      const supportsStreamingDual = (firstProvider === 'openai' && secondProvider === 'anthropic');
      
      if (useStreaming && supportsStreamingDual) {
        // Modo streaming dual (solo OpenAI + Anthropic por ahora)
        await api.streamResponse(
          {
            prompt,
            provider: 'dual',
            firstProvider,
            secondProvider,
            openaiModel: firstProvider === 'openai' ? openaiModel : undefined,
            geminiModel: firstProvider === 'gemini' ? geminiModel : undefined,
            anthropicModel: secondProvider === 'anthropic' ? anthropicModel : undefined,
            grokModel: secondProvider === 'grok' ? grokModel : undefined,
            openaiTemperature: firstProvider === 'openai' ? openaiTemperature : undefined,
            geminiTemperature: firstProvider === 'gemini' ? geminiTemperature : undefined,
            anthropicTemperature: secondProvider === 'anthropic' ? anthropicTemperature : undefined,
            grokTemperature: secondProvider === 'grok' ? grokTemperature : undefined,
            fileIds: fileIds.length > 0 ? fileIds : undefined
          },
          {
            onFirstChunk: (chunk) => {
              setStreamingResponses(prev => ({ ...prev, first: prev.first + chunk }));
            },
            onSecondChunk: (chunk) => {
              setStreamingResponses(prev => ({ ...prev, second: prev.second + chunk }));
            },
            onFilesInfo: (files) => {
              setStreamingFiles(files);
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
              setAbortController(null);
              // Pequeño delay para mostrar el cursor al final
              setTimeout(() => setLoading(false), 500);
            }
          },
          newAbortController.signal
        );
      } else if (useStreaming && !supportsStreamingDual) {
        // Modo streaming individual para combinaciones no soportadas en dual
        console.log(`🔄 Using individual streaming for ${firstProvider} + ${secondProvider}`);
        
        // Parallel individual streaming
        const firstModel = firstProvider === 'openai' ? openaiModel : geminiModel;
        const secondModel = secondProvider === 'anthropic' ? anthropicModel : grokModel;
        const firstTemperature = firstProvider === 'openai' ? openaiTemperature : geminiTemperature;
        const secondTemperature = secondProvider === 'anthropic' ? anthropicTemperature : grokTemperature;
        
        // Start both streams in parallel
        const firstStreamPromise = api.streamResponse(
          {
            prompt,
            provider: firstProvider,
            model: firstModel,
            temperature: firstTemperature,
            fileIds: fileIds.length > 0 ? fileIds : undefined
          },
          {
            onFirstChunk: (chunk) => {
              setStreamingResponses(prev => ({ ...prev, first: prev.first + chunk }));
            },
            onOpenAIChunk: (chunk) => {
              setStreamingResponses(prev => ({ ...prev, first: prev.first + chunk }));
            },
            onFilesInfo: (files) => {
              setStreamingFiles(files);
            },
            onError: (error) => {
              console.error(`${firstProvider} streaming error:`, error);
            }
          }
        );
        
        const secondStreamPromise = api.streamResponse(
          {
            prompt,
            provider: secondProvider,
            model: secondModel, 
            temperature: secondTemperature,
            fileIds: fileIds.length > 0 ? fileIds : undefined
          },
          {
            onSecondChunk: (chunk) => {
              setStreamingResponses(prev => ({ ...prev, second: prev.second + chunk }));
            },
            onAnthropicChunk: (chunk) => {
              setStreamingResponses(prev => ({ ...prev, second: prev.second + chunk }));
            },
            onError: (error) => {
              console.error(`${secondProvider} streaming error:`, error);
            }
          }
        );
        
        // Wait for both streams to complete
        await Promise.all([firstStreamPromise, secondStreamPromise]);
        refetchStatistics();
        setAbortController(null);
        setTimeout(() => setLoading(false), 500);
      } else {
        // Modo normal (sin streaming)
        const response = await api.generateDualResponse({
          prompt,
          firstProvider,
          secondProvider,
          openaiModel: firstProvider === 'openai' ? openaiModel : undefined,
          geminiModel: firstProvider === 'gemini' ? geminiModel : undefined,
          anthropicModel: secondProvider === 'anthropic' ? anthropicModel : undefined,
          grokModel: secondProvider === 'grok' ? grokModel : undefined,
          openaiTemperature: firstProvider === 'openai' ? openaiTemperature : undefined,
          geminiTemperature: firstProvider === 'gemini' ? geminiTemperature : undefined,
          anthropicTemperature: secondProvider === 'anthropic' ? anthropicTemperature : undefined,
          grokTemperature: secondProvider === 'grok' ? grokTemperature : undefined,
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
            <LLMResponseBox
              provider={firstProvider}
              availableProviders={['openai', 'gemini']}
              response={useStreaming ? streamingResponses.first : (responses?.data?.first.response || '')}
              model={firstProvider === 'openai' ? openaiModel : geminiModel}
              temperature={firstProvider === 'openai' ? openaiTemperature : geminiTemperature}
              models={firstProvider === 'openai' ? openaiModels : geminiModels}
              loading={loading}
              attachedFiles={useStreaming ? streamingFiles : responses?.data?.first.attachedFiles}
              onProviderChange={(provider) => setFirstProvider(provider as 'openai' | 'gemini')}
              onModelChange={firstProvider === 'openai' ? setOpenaiModel : setGeminiModel}
              onTemperatureChange={firstProvider === 'openai' ? setOpenaiTemperature : setGeminiTemperature}
            />

            <LLMResponseBox
              provider={secondProvider}
              availableProviders={['anthropic', 'grok']}
              response={useStreaming ? streamingResponses.second : (responses?.data?.second.response || '')}
              model={secondProvider === 'anthropic' ? anthropicModel : grokModel}
              temperature={secondProvider === 'anthropic' ? anthropicTemperature : grokTemperature}
              models={secondProvider === 'anthropic' ? anthropicModels : grokModels}
              loading={loading}
              attachedFiles={useStreaming ? streamingFiles : responses?.data?.second.attachedFiles}
              onProviderChange={(provider) => setSecondProvider(provider as 'anthropic' | 'grok')}
              onModelChange={secondProvider === 'anthropic' ? setAnthropicModel : setGrokModel}
              onTemperatureChange={secondProvider === 'anthropic' ? setAnthropicTemperature : setGrokTemperature}
            />
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
            <li>Comparación simultánea de respuestas de dos LLM</li>
            <li>Selección dinámica de modelos</li>
            <li>Ajuste de temperatura para controlar la creatividad</li>
            <li>Contador de prompts generados</li>
            <li>Interfaz bilingüe optimizada</li>
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