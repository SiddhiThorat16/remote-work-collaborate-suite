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
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-0">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Hero Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
          <div className="flex items-center gap-4">
            <span className="inline-block bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full px-6 py-3 text-3xl font-bold shadow-lg border-4 border-white">📁</span>
            <div>
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 drop-shadow-lg tracking-tight">Your Workspaces</h1>
              <p className="mt-2 text-lg text-gray-500 font-medium">Manage, create, and join collaborative spaces.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 hover:bg-indigo-700 transition-all duration-200"
              onClick={() => { setShowCreateModal(true); setCreateModalError(''); }}
            >
              <span className="flex items-center gap-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg> Create Workspace</span>
            </button>
            <button
              className="px-6 py-2 bg-gradient-to-r from-green-400 to-green-600 text-white font-bold rounded-xl shadow-lg hover:scale-105 hover:bg-green-700 transition-all duration-200"
              onClick={() => { setShowJoinModal(true); setJoinModalError(''); }}
            >
              <span className="flex items-center gap-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 12l-4-4-4 4m8 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6" /></svg> Join Workspace</span>
            </button>
          </div>
        </div>

        {/* Workspace Cards */}
        <div className="mt-8">
          {loading ? (
            <p className="text-gray-500 text-center mt-24 animate-pulse text-xl font-semibold">
              Loading workspaces...
            </p>
          ) : error ? (
            <p className="text-red-500 text-center mt-24 text-xl font-semibold">{error}</p>
          ) : workspaces.length === 0 ? (
            <p className="text-gray-600 text-center mt-24 text-xl font-semibold">No workspaces yet. Create or join one!</p>
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
      </div>

      {/* ---------- Create Workspace Modal ---------- */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 w-full max-w-md shadow-2xl border border-purple-200">
            <h2 className="text-2xl font-extrabold text-purple-700 mb-6 text-center">Create Workspace</h2>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <input
                type="text"
                placeholder="Workspace Name"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-purple-50 text-gray-800 placeholder:text-purple-300"
              />
              {createModalError && <p className="text-red-500 mb-2 text-center font-semibold animate-pulse">{createModalError}</p>}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="px-5 py-2 border-2 border-purple-200 rounded-xl font-bold text-purple-700 bg-white hover:bg-purple-50 transition"
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
                  className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 hover:bg-indigo-700 transition-all duration-200"
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
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 w-full max-w-md shadow-2xl border border-green-200">
            <h2 className="text-2xl font-extrabold text-green-700 mb-6 text-center">Join Workspace</h2>
            <form onSubmit={handleJoinWorkspace} className="space-y-4">
              <input
                type="text"
                placeholder="Workspace ID"
                value={joinWorkspaceId}
                onChange={(e) => setJoinWorkspaceId(e.target.value)}
                className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50 text-gray-800 placeholder:text-green-300"
              />
              {joinModalError && <p className="text-red-500 mb-2 text-center font-semibold animate-pulse">{joinModalError}</p>}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="px-5 py-2 border-2 border-green-200 rounded-xl font-bold text-green-700 bg-white hover:bg-green-50 transition"
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
                  className="px-5 py-2 bg-gradient-to-r from-green-400 to-green-600 text-white font-bold rounded-xl shadow-lg hover:scale-105 hover:bg-green-700 transition-all duration-200"
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
