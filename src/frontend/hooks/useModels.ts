import { useState, useEffect } from 'react';
import { api } from '../services/api';

export const useModels = () => {
  const [openaiModels, setOpenaiModels] = useState<string[]>([]);
  const [anthropicModels, setAnthropicModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      try {
        const response = await api.getModels();
        if (response.success && response.data) {
          setOpenaiModels(response.data.openai);
          setAnthropicModels(response.data.anthropic);
        }
      } catch (error) {
        console.error('Error fetching models:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  return {
    openaiModels,
    anthropicModels,
    loading
  };
};