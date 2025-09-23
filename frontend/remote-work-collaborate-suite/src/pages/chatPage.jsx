// src/pages/ChatPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const ChatPage = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const workspaceName = location.state?.workspaceName || `Workspace ${workspaceId}`;

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/messages/${workspaceId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Map messages to include senderName fallback
        const mappedMessages = (res.data || []).map(msg => ({
          ...msg,
          senderName:
            msg.senderName || msg.sender_name || (msg.sender_id === localStorage.getItem('user_id') ? 'You' : 'User'),
        }));

        setMessages(mappedMessages);
      } catch (err) {
        console.error(err);
        setMessages([]); // allow sending first message
      }
    };
    fetchMessages();
  }, [workspaceId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const sender_id = localStorage.getItem('user_id'); // logged-in user id
      const res = await axios.post(
        'http://localhost:5000/api/messages/',
        {
          workspace_id: workspaceId,
          sender_id,
          content: input,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages(prev => [
        ...prev,
        {
          ...res.data,
          senderName: 'You', // mark current user's message
        },
      ]);

      setInput('');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to send message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">{workspaceName} Chat</h1>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
        >
          Back
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {messages.length === 0 && (
          <p className="text-gray-500 text-center mt-10">No messages yet. Start chatting!</p>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`max-w-xs p-3 rounded-lg break-words ${
              msg.senderName === 'You'
                ? 'bg-green-200 ml-auto text-right'
                : 'bg-white mr-auto text-left shadow-sm'
            }`}
          >
            <p className="text-sm">{msg.content || msg.text}</p>
            <span className="text-xs text-gray-500 block mt-1">
              {msg.senderName || 'User'}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>

      <div className="p-4 flex space-x-2 bg-white shadow-md">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPage;
