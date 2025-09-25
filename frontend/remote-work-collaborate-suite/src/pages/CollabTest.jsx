// src/pages/CollabTest.jsx
import React from 'react';
import CollaborativeEditor from '../components/CollaborativeEditor.jsx';

const CollabTest = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Collaborative Editor Test</h2>
      <CollaborativeEditor docName="workspace-1" />
    </div>
  );
};

export default CollabTest;
