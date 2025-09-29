// src/components/WorkspaceCard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const WorkspaceCard = ({ workspace, onInitiateChat }) => {
  const [chatInitiated, setChatInitiated] = useState(workspace.chat_initiated || false);
  const navigate = useNavigate();

  const handleInitiateChat = () => {
    if (onInitiateChat) {
      onInitiateChat(workspace.id)
        .then(() => {
          setChatInitiated(true);
          alert(`Chat initiated for workspace: ${workspace.name}`);
        })
        .catch(err => console.error('Chat initiation failed', err));
    }
  };

  const handleStartChat = () => {
    navigate(`/chat/${workspace.id}`, { state: { workspaceName: workspace.name } });
  };

  const handleGoToBoards = () => {
    navigate(`/boards/${workspace.id}`);
  };

  return (
    <div className="bg-white shadow-md rounded-2xl p-6 hover:shadow-xl transition-shadow duration-300">
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{workspace.name}</h3>
      <p className="text-gray-500 text-sm mb-2">
        ID: <span className="font-medium">{workspace.human_id}</span>
      </p>
      <span
        className={`inline-block px-3 py-1 text-sm rounded-full font-medium ${
          workspace.role === 'owner'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-green-100 text-green-700'
        }`}
      >
        {workspace.role.toUpperCase()}
      </span>
      <p className="text-gray-400 text-xs mt-3">
        Joined: {workspace.joined_at ? new Date(workspace.joined_at).toLocaleDateString() : '-'}
      </p>

      <div className="mt-4 flex flex-col space-y-2">
        {workspace.role === 'owner' && (
          <button
            onClick={handleInitiateChat}
            disabled={chatInitiated}
            className={`px-4 py-2 rounded-lg text-white font-medium transition-colors duration-200 ${
              chatInitiated ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {chatInitiated ? 'Chat Initiated' : 'Initiate Chat'}
          </button>
        )}

        <button
          onClick={handleStartChat}
          className={`px-4 py-2 rounded-lg text-white font-medium transition-colors duration-200 ${
            workspace.role === 'owner' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          Start Chat
        </button>

        {/* New button to go to Boards */}
        <button
          onClick={handleGoToBoards}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
        >
          Go to Boards
        </button>
      </div>
    </div>
  );
};

export default WorkspaceCard;






/*





*/