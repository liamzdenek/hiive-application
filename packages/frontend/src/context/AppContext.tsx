import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SentimentSummary } from '@hiive/shared';
import { companyService } from '../services/api';

// Define the context state type
interface AppContextState {
  selectedCompany: string;
  companies: Array<{ id: string; name: string }>;
  sentimentData: SentimentSummary | null;
  isLoading: boolean;
  error: string | null;
  setSelectedCompany: (companyId: string) => void;
  refreshSentiment: () => Promise<void>;
}

// Create the context with default values
const AppContext = createContext<AppContextState>({
  selectedCompany: '',
  companies: [],
  sentimentData: null,
  isLoading: false,
  error: null,
  setSelectedCompany: () => {},
  refreshSentiment: async () => {},
});

// Custom hook for using the context
export const useAppContext = () => useContext(AppContext);

// Provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedCompany, setSelectedCompany] = useState<string>('company-123'); // Default to first company
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [sentimentData, setSentimentData] = useState<SentimentSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch companies on mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await companyService.getCompanies();
        if (response.status === 'success' && response.data) {
          setCompanies(response.data);
          
          // If no company is selected, select the first one
          if (!selectedCompany && response.data.length > 0) {
            setSelectedCompany(response.data[0]?.id || '');
          }
        } else {
          setError('Failed to fetch companies');
        }
      } catch (err) {
        setError('An error occurred while fetching companies');
        console.error(err);
      }
    };

    fetchCompanies();
  }, []);

  // Fetch sentiment data when selected company changes
  useEffect(() => {
    if (selectedCompany) {
      fetchSentimentData();
    }
  }, [selectedCompany]);

  // Function to fetch sentiment data
  const fetchSentimentData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await companyService.getCompanySentiment(selectedCompany);
      if (response.status === 'success' && response.data) {
        setSentimentData(response.data);
      } else {
        setError(response.message || 'Failed to fetch sentiment data');
      }
    } catch (err) {
      setError('An error occurred while fetching sentiment data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to refresh sentiment data
  const refreshSentiment = async () => {
    if (!selectedCompany) return;

    setIsLoading(true);
    setError(null);

    try {
      const refreshResponse = await companyService.refreshCompanySentiment(selectedCompany);
      if (refreshResponse.status === 'success') {
        // Wait a moment for the backend to process the refresh
        setTimeout(fetchSentimentData, 1000);
      } else {
        setError(refreshResponse.message || 'Failed to refresh sentiment data');
        setIsLoading(false);
      }
    } catch (err) {
      setError('An error occurred while refreshing sentiment data');
      console.error(err);
      setIsLoading(false);
    }
  };

  // Context value
  const value: AppContextState = {
    selectedCompany,
    companies,
    sentimentData,
    isLoading,
    error,
    setSelectedCompany,
    refreshSentiment,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};