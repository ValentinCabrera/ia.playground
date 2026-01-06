import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  IconButton, 
  Stack, 
  Avatar, 
  CircularProgress,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Drawer,
  Tooltip,
  Divider,
  Card,
  CardMedia,
  InputBase
} from '@mui/material';
import { 
  Send, 
  Settings as SettingsIcon, 
  Trash2, 
  Copy, 
  User, 
  Bot, 
  Sparkles, 
  Code,
  Image as ImageIcon, 
  Mic, 
  Upload,
  FileAudio,
  Plus,
  X,
  Check
} from 'lucide-react';
import { useOpenAI } from '../context/OpenAIContext';
import { motion, AnimatePresence } from 'framer-motion';

const UnifiedChat = ({ 
  mode = 'chat', // 'chat' | 'vision' | 'transcription'
  onProcessMessage, // Function to handle API call: (text, file) => Promise<Stream|Text>
  placeholder = "Escribe un mensaje...",
  title = "Chat Playground",
  icon = <Sparkles size={24} />,
  acceptedFileTypes = "",
  initialSystemMessage = ""
}) => {
  const { isConfigured } = useOpenAI();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Model Parameters (kept internal for Chat mode, or could be lifted up)
  const [model, setModel] = useState('gpt-4o');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' }); // or audio/webm
        const audioFile = new File([audioBlob], "grabacion_de_voz.wav", { type: 'audio/wav' });
        setFile(audioFile);
        setFilePreview(URL.createObjectURL(audioBlob));
        setIsRecording(false);
        setRecordingDuration(0);
        stream.getTracks().forEach(track => track.stop()); // Stop mic usage
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("No se pudo acceder al micrófono. Por favor verifica los permisos.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      clearInterval(timerRef.current);
      setIsRecording(false);
      setRecordingDuration(0);
      audioChunksRef.current = [];
      // Note: onstop will fire, but we handle logic there. Ideally we should set a flag to ignore the file creation if cancelled,
      // but simpler: we just clear it.
      // Actually, onstop logic above sets the file. Let's fix that slightly or just clearFile() after.
      // Better: detach onstop before stopping if cancelling.
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const formatDuration = (sec) => {
    const min = Math.floor(sec / 60);
    const s = sec % 60;
    return `${min}:${s < 10 ? '0' : ''}${s}`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, filePreview]);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setFilePreview(reader.result);
        reader.readAsDataURL(selectedFile);
      } else if (selectedFile.type.startsWith('audio/')) {
        setFilePreview(URL.createObjectURL(selectedFile));
      }
    }
  };

  const clearFile = () => {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if ((!input.trim() && !file) || !isConfigured || loading) return;

    // 1. Create User Message
    const userContent = input;
    const userAttachment = filePreview;
    const userFileType = file?.type;
    
    const userMessage = { 
      role: 'user', 
      content: userContent,
      attachment: userAttachment,
      fileType: userFileType
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setIsWaiting(true);

    // Clear file input immediately from UI
    const currentFile = file;
    clearFile();

    try {
      // 2. Prepare Assistant Message Placeholder
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      // 3. Call Processor
      const result = await onProcessMessage({ 
        text: userContent, 
        file: currentFile, 
        messages: [...messages, userMessage],
        model, 
        temperature, 
        maxTokens 
      });

      if (result && typeof result[Symbol.asyncIterator] === 'function') {
        // Handle Stream
        let fullContent = '';
        for await (const chunk of result) {
          const content = chunk.choices?.[0]?.delta?.content || ''; 
          if (content) {
            if (setIsWaiting) setIsWaiting(false);
            fullContent += content;
            setMessages(prev => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = { 
                role: 'assistant', 
                content: fullContent 
              };
              return newMessages;
            });
          }
        }
      } else {
        // Handle Static Text Response
        setIsWaiting(false);
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { 
            role: 'assistant', 
            content: result 
          };
          return newMessages;
        });
      }

    } catch (error) {
      console.error("Error processing message:", error);
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1].role === 'assistant' && !newMessages[newMessages.length - 1].content) {
             newMessages[newMessages.length - 1] = { role: 'assistant', content: `Error: ${error.message}`, isError: true };
        } else {
             newMessages.push({ role: 'assistant', content: `Error: ${error.message}`, isError: true });
        }
        return newMessages;
      });
    } finally {
      setLoading(false);
      setIsWaiting(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    clearFile();
    setInput('');
  };

  const renderAttachment = (msg) => {
    if (!msg.attachment) return null;

    if (msg.fileType?.startsWith('image/')) {
      return (
        <Paper elevation={0} sx={{ 
          p: 1, 
          bgcolor: 'rgba(0,0,0,0.2)', 
          borderRadius: 2, 
          mb: 1, 
          maxWidth: 250,
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <img src={msg.attachment} alt="Upload" style={{ width: '100%', borderRadius: 8, display: 'block' }} />
        </Paper>
      );
    } else if (msg.fileType?.startsWith('audio/')) {
      return (
        <Paper elevation={0} sx={{ 
          p: 1.5, 
          bgcolor: 'rgba(0,0,0,0.2)', 
          borderRadius: 4, 
          mb: 1, 
          width: '100%',
          minWidth: 200,
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <FileAudio size={20} color="#7c4dff" />
          <audio src={msg.attachment} controls style={{ height: 30, maxWidth: '100%' }} />
        </Paper>
      );
    }
    return null;
  };

  // ... (existing helper functions) ...

  // Render Logic Update
  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* ... (Header - same) ... */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" component="div" className="gradient-text" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            {icon} {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {mode === 'chat' && `Modelo: ${model} • `} Estado: {isConfigured ? 'Listo' : 'Sin Configurar'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Limpiar Chat">
            <IconButton onClick={clearChat} size="small" sx={{ color: 'text.secondary' }}>
              <Trash2 size={20} />
            </IconButton>
          </Tooltip>
          {mode === 'chat' && (
            <Tooltip title="Configuración">
              <IconButton onClick={() => setShowSettings(true)} size="small" color="primary">
                <SettingsIcon size={20} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>

      {/* Messages Area */}
      <Paper 
        className="glass-morphism"
        sx={{ 
          flexGrow: 1, 
          mb: 2, 
          p: 3, 
          overflowY: 'auto', 
          display: 'flex', 
          flexDirection: 'column',
          gap: 2,
          borderRadius: 4
        }}
      >
        {/* ... (Messages content - same) ... */}
        {messages.length === 0 && (
          <Box sx={{ m: 'auto', textAlign: 'center', maxWidth: 400, opacity: 0.7 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.dark', m: 'auto', mb: 2 }}>
              {mode === 'vision' ? <ImageIcon size={32} /> : mode === 'transcription' ? <Mic size={32} /> : <Bot size={32} />}
            </Avatar>
            <Typography variant="h6" gutterBottom>
              {mode === 'vision' ? 'Sube una imagen para analizar' : 
               mode === 'transcription' ? 'Graba o sube audio para transcribir' : 
               '¿En qué puedo ayudarte?'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {mode === 'vision' ? 'Analizaré objetos, texto y detalles visuales.' : 
               mode === 'transcription' ? 'Usa el micrófono o archivos para convertir voz a texto.' : 
               'Escribe para comenzar una conversación.'}
            </Typography>
          </Box>
        )}

        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                mb: 1
              }}>
                <Avatar sx={{ 
                  bgcolor: msg.role === 'user' ? 'primary.dark' : 'secondary.dark',
                  width: 32,
                  height: 32,
                  mt: 0.5,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                }}>
                  {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                </Avatar>
                <Paper sx={{ 
                  p: 2, 
                  maxWidth: '85%',
                  minWidth: msg.attachment ? 200 : 'auto',
                  bgcolor: msg.role === 'user' ? 'primary.main' : 'background.paper',
                  borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  boxShadow: msg.role === 'user' 
                    ? '0 4px 15px rgba(124, 77, 255, 0.2)' 
                    : '0 4px 15px rgba(0, 0, 0, 0.2)',
                  border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.05)' : 'none',
                }}>
                  {renderAttachment(msg)}
                  {(msg.content || msg.role === 'assistant') && (
                    <Typography variant="body1" sx={{ 
                      whiteSpace: 'pre-wrap', 
                      color: msg.isError ? 'error.main' : 'inherit',
                      lineHeight: 1.6,
                      fontSize: '0.95rem'
                    }}>
                      {msg.content || (msg.role === 'assistant' && !msg.isError ? 'Generando...' : '')}
                    </Typography>
                  )}
                  {msg.role === 'assistant' && msg.content && !msg.isError && !loading && (
                    <IconButton 
                      size="small" 
                      onClick={() => navigator.clipboard.writeText(msg.content)}
                      sx={{ position: 'absolute', bottom: -28, right: 0, opacity: 0.4, '&:hover': { opacity: 1 } }}
                    >
                      <Copy size={14} />
                    </IconButton>
                  )}
                </Paper>
              </Box>
            </motion.div>
          ))}
        </AnimatePresence>
        {isWaiting && (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'secondary.dark', width: 32, height: 32, boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
              <Bot size={18} />
            </Avatar>
            <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid rgba(255,255,255,0.05)' }}>
              <CircularProgress size={16} color="secondary" />
            </Paper>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Paper>

      {/* Input Area */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', pb: 2 }}>
        {mode !== 'chat' && !isRecording && (
          <>
            <input 
              type="file" 
              hidden 
              ref={fileInputRef}
              accept={mode === 'vision' ? "image/*" : "audio/*"}
              onChange={handleFileSelect}
            />
            <Tooltip title={mode === 'vision' ? "Subir Imagen" : "Grabar Audio"}>
              <IconButton 
                onClick={mode === 'transcription' ? startRecording : () => fileInputRef.current?.click()}
                sx={{ 
                  bgcolor: 'background.paper', 
                  width: 50, 
                  height: 50, 
                  borderRadius: '50%',
                  border: filePreview ? '2px solid #7c4dff' : '1px solid rgba(255,255,255,0.1)',
                  mb: 0.5
                }}
              >
                {mode === 'vision' ? <ImageIcon size={24} /> : <Mic size={24} />}
              </IconButton>
            </Tooltip>
          </>
        )}
        
        <Paper 
          elevation={0}
          sx={{ 
            flexGrow: 1, 
            bgcolor: isRecording ? '#1e1e1e' : 'background.paper', // Darker background when recording
            borderRadius: 4,
            border: isRecording ? '1px solid rgba(124, 77, 255, 0.5)' : '1px solid rgba(255,255,255,0.1)',
            transition: 'all 0.3s',
            '&:focus-within': {
              borderColor: 'primary.main',
              boxShadow: '0 0 0 2px rgba(124, 77, 255, 0.2)'
            },
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            minHeight: 56,
            justifyContent: 'center'
          }}
        >
          {isRecording ? (
             <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', px: 1 }}>
               <IconButton onClick={cancelRecording} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'error.main' } }}>
                 <X size={18} />
               </IconButton>

               {/* Waveform Visualization */}
               <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, height: 24, mx: 2 }}>
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        height: [4, 12 + Math.random() * 12, 4],
                        backgroundColor: ['#7c4dff', '#b388ff', '#7c4dff']
                      }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 0.5 + Math.random() * 0.5,
                        delay: i * 0.05
                      }}
                      style={{
                        width: 4,
                        borderRadius: 2,
                        backgroundColor: '#7c4dff'
                      }}
                    />
                  ))}
               </Box>

               <Typography variant="body2" sx={{ fontFamily: 'monospace', minWidth: 40, textAlign: 'center' }}>
                 {formatDuration(recordingDuration)}
               </Typography>

               <IconButton onClick={stopRecording} size="small" sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, ml: 2 }}>
                 <Check size={18} />
               </IconButton>
             </Box>
          ) : (
             <>
               {filePreview && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Box sx={{ 
                    position: 'relative', 
                    width: 64, 
                    height: 64, 
                    borderRadius: 3, 
                    overflow: 'visible',
                    border: '1px solid rgba(255,255,255,0.1)',
                    bgcolor: 'background.paper',
                    backgroundImage: mode === 'vision' ? `url(${filePreview})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {mode !== 'vision' && <FileAudio size={24} color="#7c4dff" />}
                    
                    <IconButton 
                      size="small" 
                      onClick={clearFile}
                      sx={{ 
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        bgcolor: 'rgba(60,60,60,0.9)', 
                        color: 'white',
                        width: 20, 
                        height: 20,
                        minHeight: 0,
                        p: 0,
                        '&:hover': { bgcolor: 'rgba(90,90,90,1)' },
                        border: '1px solid rgba(255,255,255,0.2)'
                      }}
                    >
                      <Plus size={12} style={{ transform: 'rotate(45deg)' }} />
                    </IconButton>
                  </Box>
                </Box>
              )}

              <InputBase
                fullWidth
                multiline
                maxRows={8}
                placeholder={
                  mode === 'vision' ? "Descríbe la imagen (opcional)..." :
                  mode === 'transcription' ? "Graba audio o escribe un comentario..." : 
                  placeholder
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={!isConfigured || loading} 
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                sx={{ 
                  fontSize: '1rem',
                  lineHeight: 1.5,
                  color: 'text.primary'
                }}
              />
            </>
          )}
        </Paper>

        {!isRecording && (
          <IconButton 
            color="primary" 
            disabled={(!input.trim() && !file) || !isConfigured || loading}
            onClick={handleSend}
            sx={{ 
              bgcolor: 'primary.main', 
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' },
              width: 50,
              height: 50,
              borderRadius: '50%',
              mb: 0.5,
              transition: '0.2s',
              opacity: (!input.trim() && !file) ? 0.5 : 1
            }}
          >
            <Send size={24} />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

export default UnifiedChat;
