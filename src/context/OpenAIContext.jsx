import React, { createContext, useContext, useState, useEffect } from 'react';
import OpenAI from 'openai';

const OpenAIContext = createContext();

export const OpenAIProvider = ({ children }) => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('openai_api_key') || '');
  const [openai, setOpenai] = useState(null);

  useEffect(() => {
    if (apiKey) {
      const client = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Necessary for client-side playground
      });
      setOpenai(client);
      localStorage.setItem('openai_api_key', apiKey);
    } else {
      setOpenai(null);
      localStorage.removeItem('openai_api_key');
    }
  }, [apiKey]);

  const value = {
    apiKey,
    setApiKey,
    openai,
    isConfigured: !!openai,
  };

  return (
    <OpenAIContext.Provider value={value}>
      {children}
    </OpenAIContext.Provider>
  );
};

export const useOpenAI = () => {
  const context = useContext(OpenAIContext);
  if (!context) {
    throw new Error('useOpenAI must be used within an OpenAIProvider');
  }
  return context;
};
