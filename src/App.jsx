import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Vision from './pages/Vision';
import Transcription from './pages/Transcription';
import Assistants from './pages/Assistants';


function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/chat" element={<Chat />} />

        <Route path="/vision" element={<Vision />} />
        <Route path="/transcription" element={<Transcription />} />

        <Route path="/assistants" element={<Assistants />} />
      </Routes>
    </Layout>
  );
}

export default App;
