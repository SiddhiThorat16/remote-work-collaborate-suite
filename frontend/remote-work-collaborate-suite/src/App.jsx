// src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Signup from './pages/Signup.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ChatPage from './pages/chatPage.jsx'; // ⚡ New chat page
import BoardPage from './pages/BoardPage';
import CollabTest from './pages/CollabTest';
import DocumentEditor from './pages/DocumentEditor.jsx';
import Whiteboard from './components/Whiteboard.jsx';
import Home from './pages/Home.jsx';

function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chat/:workspaceId" element={<ChatPage />} />
        <Route path="/boards/:workspaceId" element={<BoardPage />} />
        <Route path="/collab" element={<CollabTest />} />
        <Route path="/editor/:docName" element={<DocumentEditor docName="default-doc" />} />
        <Route path="/whiteboard/:workspaceId?" element={<Whiteboard />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;
