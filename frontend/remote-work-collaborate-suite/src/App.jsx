// frontend/remote-work-collaborate-suite/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Signup from './pages/Signup.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ChatPage from './pages/chatPage.jsx';
import CollabTest from './pages/CollabTest';
import DocumentEditor from './pages/DocumentEditor.jsx';
import Whiteboard from './components/Whiteboard.jsx';
import Home from './pages/Home.jsx';
// import ListsTasksPage from "./pages/ListsTasksPage";
import ListsTasksWrapper from "./pages/ListsTasksWrapper";
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
import Navbar from './components/Navbar';
import MyHub from './pages/MyHub.jsx';
import { supabase } from './supabaseClient';

function AppRoutes({ user, setUser }) {
  const location = useLocation();
  const hideNavbar = ["/login", "/signup", "/"].includes(location.pathname);

  return (
    <>
      {!hideNavbar && <Navbar user={user} setUser={setUser} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chat/:workspaceId" element={<ChatPage />} />
        <Route path="/collab" element={<CollabTest />} />
        <Route path="/editor/:docName" element={<DocumentEditor docName="default-doc" />} />
        <Route path="/whiteboard/:workspaceId?" element={<Whiteboard />} />
        <Route path="*" element={<Home />} />
        {/* <Route path="/lists-tasks" element={<ListsTasksPage />} /> */}
        <Route path="/lists-tasks" element={<ListsTasksWrapper />} />
        <Route path="/profile" element={<Profile />} />
        <Route path='/settings' element={<Settings />} />
        <Route path="/my-hub" element={<MyHub user={user} />} /> {/* Pass user */}
      </Routes>
    </>
  );
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <Router>
      <AppRoutes user={user} setUser={setUser} />
    </Router>
  );
}

export default App;
