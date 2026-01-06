import React from 'react';
import UnifiedChat from '../components/UnifiedChat';
import { useOpenAI } from '../context/OpenAIContext';
import { Code } from 'lucide-react';
import { Box, Typography, Paper } from '@mui/material';

const Chat = () => {
  const { openai } = useOpenAI();

  const handleProcessMessage = async ({ messages, model, temperature, maxTokens }) => {
    // Map UI messages to API format
    const apiMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    return await openai.chat.completions.create({
      model: model || 'gpt-4o',
      messages: apiMessages,
      temperature: temperature || 0.7,
      max_tokens: maxTokens || 1000,
      stream: true,
    });
  };

  return (
    <UnifiedChat 
      mode="chat" 
      onProcessMessage={handleProcessMessage} 
      placeholder="Escribe un mensaje para chatear..."
    />
  );
};

export default Chat;
