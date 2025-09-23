import React, { useEffect, useState } from 'react';
import WorkspaceCard from './WorkspaceCard';
import axios from 'axios';

const WorkspaceList = () => {
  const [workspaces, setWorkspaces] = useState([]);

  useEffect(() => {
    // Fetch user's workspaces
    axios.get('/api/workspaces/my', { withCredentials: true })
      .then(res => setWorkspaces(res.data.workspaces))
      .catch(err => console.error('Failed to fetch workspaces', err));
  }, []);

  // Function to handle Start Chat button click
  const handleStartChat = async (workspaceId) => {
    try {
      await axios.post(`/api/workspaces/${workspaceId}/start-chat`, {}, { withCredentials: true });

      // Update local state to reflect chat started
      setWorkspaces(prev =>
        prev.map(ws => ws.id === workspaceId ? { ...ws, chatInitiated: true } : ws)
      );
    } catch (err) {
      console.error('Failed to start chat', err);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {workspaces.map(ws => (
        <WorkspaceCard
          key={ws.id}
          workspace={ws}
          onStartChat={handleStartChat}
        />
      ))}
    </div>
  );
};

export default WorkspaceList;
