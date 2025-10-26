import React from 'react';
import { useNavigate } from 'react-router-dom';

const WorkspaceCard = ({ workspace }) => {
  const navigate = useNavigate();

  const handleStartChat = () => {
    navigate(`/chat/${workspace.id}`, { state: { workspaceName: workspace.name } });
  };

  const handleGoToBoards = () => {
    navigate(`/lists-tasks`, { state: { workspaceId: workspace.id, workspaceName: workspace.name } });
  };

  const handleGoToWhiteboard = () => {
    navigate(`/whiteboard/${workspace.id}`);
  };

  const handleGoToVideoCall = () => {
    navigate(`/video/${workspace.id}`);
  };

  return (
    <div
      className="bg-white/95 backdrop-blur-2xl shadow-2xl rounded-[2.5rem] pt-16 pb-8 px-8 hover:scale-[1.04] hover:shadow-purple-300/40 transition-all duration-300 border border-purple-100 flex flex-col gap-3 relative overflow-visible group mb-8 mr-4"
      style={{ minWidth: 320, maxWidth: 370 }}
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="100" cy="120" rx="90" ry="70" fill="url(#grad)" />
          <defs>
            <radialGradient id="grad" cx="0.5" cy="0.5" r="0.5" gradientTransform="rotate(90 .5 .5) scale(1)">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#f472b6" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Floating workspace icon */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center justify-center z-10">
        <span className="inline-block bg-gradient-to-r from-indigo-400 to-purple-400 text-white rounded-full px-7 py-5 text-4xl font-bold shadow-lg border-4 border-white drop-shadow-xl">📁</span>
      </div>

      <div className="mt-6 text-center">
        <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 drop-shadow-lg tracking-tight mb-1">
          {workspace.name}
        </h3>
        <p className="text-gray-500 text-sm mb-2">
          ID:{' '}
          <span className="font-bold text-purple-700 underline underline-offset-2 decoration-purple-300">
            {workspace.human_id}
          </span>
        </p>
        <span
          className={`inline-block px-4 py-1 text-sm rounded-full font-bold shadow border-2 ${
            workspace.role === 'owner'
              ? 'bg-blue-100 text-blue-700 border-blue-300'
              : 'bg-green-100 text-green-700 border-green-300'
          }`}
        >
          {workspace.role.toUpperCase()}
        </span>
        <p className="text-gray-400 text-xs mt-3">
          Joined: {workspace.joined_at ? new Date(workspace.joined_at).toLocaleDateString() : '-'}
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <button
          onClick={handleStartChat}
          className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-white font-bold transition-all duration-200 shadow-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:scale-105 hover:bg-blue-700 group-hover:ring-2 group-hover:ring-purple-400"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 12l-4-4-4 4m8 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6" />
          </svg>
          Start Chat
        </button>

        <button
          onClick={handleGoToBoards}
          className="flex items-center justify-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 hover:bg-purple-700 transition-all duration-200 group-hover:ring-2 group-hover:ring-pink-400"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v4a1 1 0 001 1h3m10-5v4a1 1 0 01-1 1h-3m-4 4h4m-2 0v4m0-4V7" />
          </svg>
          Go to Boards
        </button>

        <button
          onClick={handleGoToWhiteboard}
          className="flex items-center justify-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-400 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:scale-105 hover:bg-blue-700 transition-all duration-200 group-hover:ring-2 group-hover:ring-blue-400"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v16H4z" />
          </svg>
          Go to Whiteboard
        </button>

        <button
          onClick={handleGoToVideoCall}
          className="flex items-center justify-center gap-2 px-5 py-2 bg-gradient-to-r from-green-400 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:scale-105 hover:bg-green-700 transition-all duration-200 group-hover:ring-2 group-hover:ring-blue-400"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10v4m4-2h-12a2 2 0 01-2-2v-4a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2z"/>
          </svg>
          Join Video Call
        </button>
      </div>
    </div>
  );
};

export default WorkspaceCard;
