import React from 'react';
import UnifiedChat from '../components/UnifiedChat';
import { useOpenAI } from '../context/OpenAIContext';
import { Image as ImageIcon } from 'lucide-react';

const Vision = () => {
  const { openai } = useOpenAI();

  const handleProcessMessage = async ({ messages }) => {
    // Map UI messages to API format for Vision
    // We iterate through messages. If a message has an attachment (image), we format it for GPT-4o Vision.
    const apiMessages = messages.map(msg => {
      if (msg.role === 'user' && msg.attachment && msg.fileType?.startsWith('image/')) {
        return {
          role: 'user',
          content: [
            { type: "text", text: msg.content || "Describe esta imagen detalladamente." },
            { 
              type: "image_url", 
              image_url: { 
                url: msg.attachment // attachment is base64 string in UnifiedChat
              } 
            }
          ]
        };
      } else {
        return {
          role: msg.role,
          content: msg.content || "" // Ensure content is not null
        };
      }
    });

    return await openai.chat.completions.create({
      model: "gpt-4o",
      messages: apiMessages,
      max_tokens: 1000,
      stream: true,
    });
  };

  return (
    <UnifiedChat 
      mode="vision" 
      onProcessMessage={handleProcessMessage}
      placeholder="Haz una pregunta sobre la imagen..."
      title="Panel de Visión"
      icon={<ImageIcon size={24} />}
    />
  );
};

export default Vision;
