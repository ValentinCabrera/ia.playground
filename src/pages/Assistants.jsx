import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Stack, 
  TextField, 
  Button, 
  Card, 
  CardContent, 
  Chip, 
  IconButton, 
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  Avatar
} from '@mui/material';
import { Bot, Plus, Trash2, MessageSquare, Sparkles, Brain, Code, Send, User, RotateCcw } from 'lucide-react';
import { useOpenAI } from '../context/OpenAIContext';
import { motion, AnimatePresence } from 'framer-motion';

const Assistants = () => {
  const { openai, isConfigured } = useOpenAI();
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [openChat, setOpenChat] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState(null);
  
  // Chat States
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Create Assistant States
  const [newName, setNewName] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [newModel, setNewModel] = useState('gpt-4o');

  useEffect(() => {
    if (isConfigured) {
      fetchAssistants();
    }
  }, [isConfigured]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchAssistants = async () => {
    setLoading(true);
    try {
      const myAssistants = await openai.beta.assistants.list({
        order: "desc",
        limit: "20",
      });
      setAssistants(myAssistants.data);
    } catch (error) {
      console.error("Error al obtener asistentes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName || !newInstructions) return;
    setLoading(true);
    try {
      await openai.beta.assistants.create({
        name: newName,
        instructions: newInstructions,
        model: newModel,
      });
      setOpenCreate(false);
      fetchAssistants();
      setNewName('');
      setNewInstructions('');
    } catch (error) {
      console.error("Error al crear asistente:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este agente?')) return;
    setLoading(true);
    try {
      await openai.beta.assistants.del(id);
      fetchAssistants();
    } catch (error) {
      console.error("Error al eliminar asistente:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Chat Functionality ---

  const startChat = async (assistant) => {
    setSelectedAssistant(assistant);
    setOpenChat(true);
    setMessages([]);
    setChatLoading(true);
    try {
      const newThread = await openai.beta.threads.create();
      setThread(newThread);
    } catch (error) {
      console.error("Error al crear hilo:", error);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || chatLoading || !thread) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    try {
      // 1. Add message to thread
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: userMsg
      });

      // 2. Run the assistant
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: selectedAssistant.id
      });

      // 3. Poll for completion
      let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      while (runStatus.status !== 'completed') {
        if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
          throw new Error(`Run ${runStatus.status}`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      }

      // 4. Get messages
      const threadMessages = await openai.beta.threads.messages.list(thread.id);
      const lastMsg = threadMessages.data[0];
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: lastMsg.content[0].text.value 
      }]);

    } catch (error) {
      console.error("Error en el chat:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}`, isError: true }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h4" component="div" className="gradient-text" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Bot size={32} /> Panel de Asistentes
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Crea y gestiona agentes inteligentes persistentes con instrucciones personalizadas.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Plus size={18} />} 
          onClick={() => setOpenCreate(true)}
          disabled={!isConfigured}
        >
          Crear Agente
        </Button>
      </Box>

      {!isConfigured && (
        <Alert severity="error" sx={{ mb: 4 }}>
          Configura tu API Key en el Panel de Control para gestionar asistentes.
        </Alert>
      )}

      {loading && assistants.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {assistants.map((assistant) => (
            <Grid item xs={12} sm={6} md={4} key={assistant.id}>
              <Card sx={{ height: '100%', position: 'relative', overflow: 'visible', transition: '0.3s', '&:hover': { transform: 'translateY(-5px)' } }}>
                <Box sx={{ 
                  position: 'absolute', 
                  top: -15, 
                  left: 20, 
                  bgcolor: 'primary.main', 
                  p: 1, 
                  borderRadius: 2,
                  boxShadow: 3
                }}>
                  <Brain size={20} color="white" />
                </Box>
                <CardContent sx={{ pt: 4 }}>
                  <Typography variant="h6" gutterBottom noWrap>{assistant.name || 'Sin nombre'}</Typography>
                  <Chip label={assistant.model} size="small" variant="outlined" sx={{ mb: 2 }} />
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 2, 
                      display: '-webkit-box', 
                      WebkitLineClamp: 3, 
                      WebkitBoxOrient: 'vertical', 
                      overflow: 'hidden',
                      height: 60
                    }}
                  >
                    {assistant.instructions || 'Sin instrucciones adicionales.'}
                  </Typography>
                  <Divider sx={{ mb: 2, opacity: 0.1 }} />
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Probar Agente">
                      <IconButton size="small" color="secondary" onClick={() => startChat(assistant)}>
                        <MessageSquare size={18} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton size="small" color="error" onClick={() => handleDelete(assistant.id)}>
                        <Trash2 size={18} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {assistants.length === 0 && !loading && (
            <Grid item xs={12}>
              <Paper sx={{ p: 8, textAlign: 'center', bgcolor: 'transparent', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <Bot size={48} color="rgba(255,255,255,0.1)" style={{ marginBottom: 16 }} />
                <Typography variant="h6" color="text.secondary">No tienes agentes creados todavía</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Los agentes te permiten crear experiencias de IA persistentes con memoria y herramientas.
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Create Assistant Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Sparkles size={20} color="#7c4dff" /> Nuevo Agente Inteligente
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Nombre del Agente"
              placeholder="Ej: Asistente Curador de Contenido"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <TextField
              fullWidth
              label="Modelo"
              select
              SelectProps={{ native: true }}
              value={newModel}
              onChange={(e) => setNewModel(e.target.value)}
            >
              <option value="gpt-4o">gpt-4o</option>
              <option value="gpt-4o-mini">gpt-4o-mini</option>
              <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
            </TextField>
            <TextField
              fullWidth
              label="Instrucciones (System Prompt)"
              multiline
              rows={4}
              placeholder="Eres un asistente especializado en..."
              value={newInstructions}
              onChange={(e) => setNewInstructions(e.target.value)}
            />
            <Alert severity="info" variant="outlined">
              Las instrucciones definen la personalidad y el conocimiento base de tu agente.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenCreate(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleCreate} 
            disabled={loading || !newName || !newInstructions}
          >
            {loading ? <CircularProgress size={24} /> : 'Crear Agente'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assistant Chat Dialog */}
      <Dialog open={openChat} onClose={() => setOpenChat(false)} maxWidth="md" fullWidth PaperProps={{ sx: { height: '80vh', bgcolor: 'background.paper' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Bot size={20} color="#7c4dff" />
            <Typography variant="h6">Chateando con: {selectedAssistant?.name}</Typography>
          </Box>
          <IconButton onClick={() => setOpenChat(false)} size="small">
            <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', bgcolor: 'rgba(0,0,0,0.1)' }}>
          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    mb: 2,
                    alignItems: 'flex-start'
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
                      borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px', 
                      bgcolor: msg.role === 'user' ? 'primary.main' : 'background.paper',
                      boxShadow: msg.role === 'user' 
                        ? '0 4px 15px rgba(124, 77, 255, 0.2)' 
                        : '0 4px 15px rgba(0, 0, 0, 0.2)',
                      border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    }}>
                      <Typography variant="body1" sx={{ 
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.6,
                        fontSize: '0.95rem'
                      }}>
                        {msg.content}
                      </Typography>
                    </Paper>
                  </Box>
                </motion.div>
              ))}
            </AnimatePresence>
            {chatLoading && (
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.dark', width: 32, height: 32, boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                  <Bot size={18} />
                </Avatar>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <CircularProgress size={16} color="secondary" />
                </Paper>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Escribe un mensaje..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={chatLoading}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <IconButton 
            color="primary" 
            onClick={handleSendMessage} 
            disabled={!input.trim() || chatLoading}
            sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            <Send size={20} />
          </IconButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Assistants;
