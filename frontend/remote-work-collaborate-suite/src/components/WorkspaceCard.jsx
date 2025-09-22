// src/components/WorkspaceCard.jsx
import React from 'react';

const WorkspaceCard = ({ workspace }) => {
  return (
    <div className="bg-white shadow-md rounded-2xl p-6 hover:shadow-xl transition-shadow duration-300">
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{workspace.name}</h3>
      <p className="text-gray-500 text-sm mb-2">ID: <span className="font-medium">{workspace.human_id}</span></p>
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
    </div>
  );
};

export default WorkspaceCard;
