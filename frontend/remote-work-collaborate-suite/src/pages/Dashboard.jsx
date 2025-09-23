// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import WorkspaceCard from '../components/WorkspaceCard';

const Dashboard = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You are not logged in.');
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get('http://localhost:5000/api/workspaces/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWorkspaces(res.data.workspaces || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch workspaces.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateChat = async (workspaceId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/workspaces/${workspaceId}/start-chat`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWorkspaces(prev =>
        prev.map(ws =>
          ws.id === workspaceId ? { ...ws, chat_initiated: true } : ws
        )
      );
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to initiate chat');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-10">
      {loading ? (
        <p className="text-gray-500 text-center mt-24 animate-pulse">Loading workspaces...</p>
      ) : error ? (
        <p className="text-red-500 text-center mt-24">{error}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {workspaces.map(ws => (
            <WorkspaceCard
              key={ws.id}
              workspace={ws}
              onInitiateChat={handleInitiateChat}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
