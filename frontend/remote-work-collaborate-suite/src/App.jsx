// src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Signup from './pages/Signup.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ChatPage from './pages/chatPage.jsx'; // ⚡ New chat page

function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chat/:workspaceId" element={<ChatPage />} /> {/* ⚡ Chat page route */}
        <Route path="*" element={<Login setUser={setUser} />} /> {/* default route */}
      </Routes>
    </Router>
  );
}

export default App;
