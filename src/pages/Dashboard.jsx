import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Alert, 
  Paper,
  Stack,
  Chip,
  Divider
} from '@mui/material';
import { 
  Key, 
  ShieldCheck, 
  Zap, 
  Code, 
  Terminal, 
  Image as ImageIcon, 
  Mic, 
  Bot 
} from 'lucide-react';
import { useOpenAI } from '../context/OpenAIContext';

const Dashboard = () => {
  const { apiKey, setApiKey, isConfigured } = useOpenAI();
  const [localKey, setLocalKey] = useState(apiKey);

  const handleSaveKey = () => {
    setApiKey(localKey);
  };

  const featureCards = [
    {
      title: 'Chat de Texto',
      desc: 'Prueba modelos como GPT-4o y GPT-3.5 para generación de texto, razonamiento y código.',
      icon: <Zap size={24} color="#7c4dff" />,
      path: '/chat'
    },
    {
      title: 'Capacidades de Visión',
      desc: 'Analiza imágenes y obtén descripciones detalladas o respuestas a preguntas sobre contenido visual.',
      icon: <ImageIcon size={24} color="#00e5ff" />,
      path: '/vision'
    },
    {
      title: 'Voz a Texto',
      desc: 'Transcribe audio a texto con precisión milimétrica usando Whisper.',
      icon: <Mic size={24} color="#ff4081" />,
      path: '/transcription'
    },
    {
      title: 'Asistentes de IA',
      desc: 'Crea agentes persistentes con herramientas personalizables y manejo de archivos.',
      icon: <Bot size={24} color="#4caf50" />,
      path: '/assistants'
    }
  ];

  return (
    <Box>
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom component="div" className="gradient-text">
          Bienvenido al OpenAI Developer Playground
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Una herramienta diseñada para que los desarrolladores puedan probar y aprender a integrar los servicios de OpenAI rápidamente.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Card className="glass-morphism">
            <CardContent>
              <Stack spacing={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ShieldCheck size={32} color="#7c4dff" />
                  <Box>
                    <Typography variant="h6">Configura tu API Key</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tu API Key se guarda localmente en el navegador y nunca se envía a ningún servidor externo que no sea OpenAI.
                    </Typography>
                  </Box>
                </Box>

                {!isConfigured && (
                  <Alert severity="warning" variant="outlined" sx={{ borderRadius: 2 }}>
                    Necesitas configurar una API Key de OpenAI para empezar a usar el playground.
                  </Alert>
                )}

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="OpenAI API Key"
                    placeholder="sk-..."
                    type="password"
                    value={localKey}
                    onChange={(e) => setLocalKey(e.target.value)}
                    variant="outlined"
                  />
                  <Button 
                    variant="contained" 
                    onClick={handleSaveKey}
                    startIcon={<Key size={18} />}
                    sx={{ px: 4 }}
                  >
                    Guardar
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>Explora las capacidades</Typography>
            <Grid container spacing={2}>
              {featureCards.map((card) => (
                <Grid item xs={12} sm={6} key={card.title}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      cursor: 'pointer',
                      transition: '0.3s',
                      '&:hover': { transform: 'scale(1.02)' }
                    }}
                    onClick={() => window.location.href = card.path}
                  >
                    <CardContent>
                      <Box sx={{ mb: 2 }}>{card.icon}</Box>
                      <Typography variant="h6" gutterBottom>{card.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {card.desc}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', bgcolor: 'background.paper', borderRadius: 4 }}>
            <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
              <Code size={20} /> Configuración Rápida
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>1. Instala el SDK</Typography>
                <Box sx={{ p: 1.5, bgcolor: '#000', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#00e5ff' }}>
                    npm install openai
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>2. Inicializa el Cliente</Typography>
                <Box sx={{ p: 1.5, bgcolor: '#000', borderRadius: 1, fontSize: '0.75rem' }}>
                  <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace', color: '#b0b0b0' }}>
                    {`import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY
});`}
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 1, opacity: 0.1 }} />
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <Terminal size={20} /> Recursos
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip label="Docs API" size="small" component="a" href="https://platform.openai.com/docs" clickable />
                <Chip label="Precios" size="small" component="a" href="https://openai.com/pricing" clickable />
                <Chip label="Modelos" size="small" component="a" href="https://platform.openai.com/docs/models" clickable />
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
