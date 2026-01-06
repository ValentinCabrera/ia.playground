import React from 'react';
import UnifiedChat from '../components/UnifiedChat';
import { useOpenAI } from '../context/OpenAIContext';
import { Mic } from 'lucide-react';

const Transcription = () => {
  const { openai } = useOpenAI();

  const handleProcessMessage = async ({ file }) => {
    if (!file) throw new Error("No se proporcionó ningún archivo de audio.");

    const resp = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
    });

    return resp.text;
  };

  return (
    <UnifiedChat 
      mode="transcription" 
      onProcessMessage={handleProcessMessage}
      placeholder="Comentario opcional..."
      title="Panel de Transcripción"
      icon={<Mic size={24} />}
    />
  );
};

export default Transcription;
