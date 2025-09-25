// src/components/CollaborativeEditor.jsx
import React, { useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const CollaborativeEditor = ({ docName }) => {
  const [text, setText] = useState('');
  const ydocRef = useRef(null); // keep reference to Y.Doc
  const ytextRef = useRef(null); // reference to Y.Text

  useEffect(() => {
    // 1️⃣ create one Y.Doc
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // 2️⃣ connect to WebSocket server
    const provider = new WebsocketProvider('ws://localhost:1234', docName, ydoc);

    // 3️⃣ get Y.Text instance
    const ytext = ydoc.getText('shared-text');
    ytextRef.current = ytext;

    // 4️⃣ observe changes from Yjs
    ytext.observe(() => {
      setText(ytext.toString());
    });

    return () => {
      provider.disconnect();
      ydoc.destroy();
    };
  }, [docName]);

  // 5️⃣ handle local changes
  const handleChange = (e) => {
    const ytext = ytextRef.current;
    if (!ytext) return;
    ytext.delete(0, ytext.length);
    ytext.insert(0, e.target.value);
    setText(e.target.value);
  };

  return (
    <textarea
      value={text}
      onChange={handleChange}
      placeholder="Collaborative text editor..."
      style={{ width: '100%', height: '200px' }}
    />
  );
};

export default CollaborativeEditor;
