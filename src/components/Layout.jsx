import React, { useState } from 'react';
import { Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton, ListItem, ListItemButton, ListItemIcon, ListItemText, Container, Avatar, Badge, Tooltip } from '@mui/material';
import { 
  Menu as MenuIcon, 
  MessageSquare, 
  Image as ImageIcon, 
  Mic, 
  Bot, 
  Settings, 
  LayoutDashboard,
  ChevronLeft,
  Github,
  Key
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOpenAI } from '../context/OpenAIContext';

const drawerWidth = 280;

const Layout = ({ children }) => {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { isConfigured } = useOpenAI();

  const menuItems = [
    { text: 'Panel de Control', icon: <LayoutDashboard size={20} />, path: '/' },
    { text: 'Chat (Texto)', icon: <MessageSquare size={20} />, path: '/chat' },
    { text: 'Visión', icon: <ImageIcon size={20} />, path: '/vision' },
    { text: 'Transcripción', icon: <Mic size={20} />, path: '/transcription' },
    { text: 'Asistentes (Agentes)', icon: <Bot size={20} />, path: '/assistants' },
  ];

  const toggleDrawer = () => {
    setOpen(!open);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'rgba(10, 10, 12, 0.7)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: 'none'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={toggleDrawer}
              edge="start"
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" className="gradient-text" sx={{ fontWeight: 800 }}>
              OpenAI Playground
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title={isConfigured ? "API Key Configurada" : "Falta la API Key"}>
              <Badge variant="dot" color={isConfigured ? "success" : "error"}>
                <Key size={20} style={{ opacity: 0.7 }} />
              </Badge>
            </Tooltip>
            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.8rem' }}>AI</Avatar>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Drawer
        variant="permanent"
        sx={{
          width: open ? drawerWidth : 0,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            bgcolor: 'background.paper',
            borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            transition: 'width 0.3s ease-in-out',
            transform: open ? 'none' : `translateX(-${drawerWidth}px)`,
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 2, px: 2 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  selected={location.pathname === item.path}
                  sx={{
                    borderRadius: 2,
                    '&.Mui-selected': {
                      bgcolor: 'rgba(124, 77, 255, 0.15)',
                      color: 'primary.light',
                      '& .MuiListItemIcon-root': {
                        color: 'primary.light',
                      },
                    },
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 500 }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 2, opacity: 0.1 }} />
          <List>
            <ListItem disablePadding>
              <ListItemButton sx={{ borderRadius: 2 }}>
                <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                  <Settings size={20} />
                </ListItemIcon>
                <ListItemText primary="Configuración" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            Creado para Desarrolladores <Github size={12} />
          </Typography>
        </Box>
      </Drawer>
      
      <Box component="main" sx={{ flexGrow: 1, p: 3, pt: 10, width: '100%' }}>
        <Container maxWidth="xl">
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
