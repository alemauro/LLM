import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Statistics } from '../types';

export const useStatistics = () => {
  const [statistics, setStatistics] = useState<Statistics>({
    promptCount: 0,
    lastUpdated: new Date().toISOString()
  });
  const [loading, setLoading] = useState(false);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const stats = await api.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
    const interval = setInterval(fetchStatistics, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  return {
    statistics,
    loading,
    refetch: fetchStatistics
  };
};