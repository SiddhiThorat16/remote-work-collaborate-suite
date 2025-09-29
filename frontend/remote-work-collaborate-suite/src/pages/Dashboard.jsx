// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import WorkspaceCard from '../components/WorkspaceCard';
import { Dialog } from '@headlessui/react';

const Dashboard = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ---------- Create Workspace Modal ----------
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [createModalError, setCreateModalError] = useState('');

  // ---------- Join Workspace Modal ----------
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinWorkspaceId, setJoinWorkspaceId] = useState('');
  const [joinModalError, setJoinModalError] = useState('');

  // Fetch workspaces on load
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

  // ---------- Create Workspace ----------
  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!workspaceName) return setCreateModalError('Workspace name is required');

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5000/api/workspaces/create',
        { name: workspaceName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWorkspaces(prev => [res.data.workspace, ...prev]);
      setWorkspaceName('');
      setCreateModalError('');
      setShowCreateModal(false);
    } catch (err) {
      console.error(err);
      setCreateModalError(err.response?.data?.error || 'Failed to create workspace');
    }
  };

  // ---------- Join Workspace ----------
  const handleJoinWorkspace = async (e) => {
    e.preventDefault();
    if (!joinWorkspaceId) return setJoinModalError('Workspace ID is required');

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5000/api/workspaces/join',
        { human_id: joinWorkspaceId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWorkspaces(prev => [res.data.workspace, ...prev]);
      setJoinWorkspaceId('');
      setJoinModalError('');
      setShowJoinModal(false);
    } catch (err) {
      console.error(err);
      setJoinModalError(err.response?.data?.error || 'Failed to join workspace');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-10">
      {/* Top-right buttons */}
      <div className="flex justify-end space-x-4 mb-6">
        <button
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => { setShowCreateModal(true); setCreateModalError(''); }}
        >
          Create Workspace
        </button>
        <button
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          onClick={() => { setShowJoinModal(true); setJoinModalError(''); }}
        >
          Join Workspace
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center mt-24 animate-pulse">
          Loading workspaces...
        </p>
      ) : error ? (
        <p className="text-red-500 text-center mt-24">{error}</p>
      ) : workspaces.length === 0 ? (
        <p className="text-gray-600 text-center mt-24">No workspaces yet. Create or join one!</p>
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

      {/* ---------- Create Workspace Modal ---------- */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-lg font-semibold mb-4">Create Workspace</h2>
            <form onSubmit={handleCreateWorkspace}>
              <input
                type="text"
                placeholder="Workspace Name"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full px-4 py-2 border rounded mb-3"
              />
              {createModalError && <p className="text-red-500 mb-2">{createModalError}</p>}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                  onClick={() => {
                    setShowCreateModal(false);
                    setWorkspaceName('');
                    setCreateModalError('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------- Join Workspace Modal ---------- */}
      {showJoinModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-lg font-semibold mb-4">Join Workspace</h2>
            <form onSubmit={handleJoinWorkspace}>
              <input
                type="text"
                placeholder="Workspace ID"
                value={joinWorkspaceId}
                onChange={(e) => setJoinWorkspaceId(e.target.value)}
                className="w-full px-4 py-2 border rounded mb-3"
              />
              {joinModalError && <p className="text-red-500 mb-2">{joinModalError}</p>}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                  onClick={() => {
                    setShowJoinModal(false);
                    setJoinWorkspaceId('');
                    setJoinModalError('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Join
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
