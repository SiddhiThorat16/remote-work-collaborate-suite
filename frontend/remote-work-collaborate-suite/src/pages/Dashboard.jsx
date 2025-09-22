// src/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import WorkspaceCard from '../components/WorkspaceCard';

const Dashboard = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Join modal state
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [workspaceCode, setWorkspaceCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

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
      console.error('Fetch workspaces error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5000/api/workspaces/create',
        { name: workspaceName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWorkspaces([res.data.workspace, ...workspaces]);
      setWorkspaceName('');
      setShowCreateModal(false);
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Failed to create workspace.');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinWorkspace = async (e) => {
    e.preventDefault();
    setJoining(true);
    setJoinError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5000/api/workspaces/join',
        { human_id: workspaceCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refetch workspaces to include newly joined one
      fetchWorkspaces();
      setWorkspaceCode('');
      setShowJoinModal(false);
    } catch (err) {
      setJoinError(err.response?.data?.error || 'Failed to join workspace.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 md:mb-0">
          My Workspaces
        </h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + Create Workspace
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            + Join Workspace
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center mt-24 animate-pulse">Loading workspaces...</p>
      ) : error ? (
        <p className="text-red-500 text-center mt-24">{error}</p>
      ) : workspaces.length === 0 ? (
        <div className="text-center mt-24 text-gray-600">
          <p className="text-lg">No workspaces found.</p>
          <p className="mt-2 text-sm">Create or join one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {workspaces.map((ws) => (
            <WorkspaceCard key={ws.id} workspace={ws} />
          ))}
        </div>
      )}

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md relative">
            <h2 className="text-2xl font-semibold mb-4">Create Workspace</h2>
            <form onSubmit={handleCreateWorkspace}>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="Workspace Name"
                className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {createError && <p className="text-red-500 mb-2">{createError}</p>}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Workspace Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md relative">
            <h2 className="text-2xl font-semibold mb-4">Join Workspace</h2>
            <form onSubmit={handleJoinWorkspace}>
              <input
                type="text"
                value={workspaceCode}
                onChange={(e) => setWorkspaceCode(e.target.value)}
                placeholder="Enter Workspace Code"
                className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              {joinError && <p className="text-red-500 mb-2">{joinError}</p>}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joining}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {joining ? 'Joining...' : 'Join'}
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
