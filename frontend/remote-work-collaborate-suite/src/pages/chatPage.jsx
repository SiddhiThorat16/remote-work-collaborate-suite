// src/pages/ChatPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';

const ChatPage = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const workspaceName = location.state?.workspaceName || `Workspace ${workspaceId}`;

  // Fetch messages and setup socket.io
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/messages/${workspaceId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const mappedMessages = (res.data || []).map(msg => ({
          ...msg,
          senderName:
            msg.senderName || msg.sender_name || (msg.sender_id === localStorage.getItem('user_id') ? 'You' : 'User'),
        }));
        setMessages(mappedMessages);
      } catch (err) {
        console.error(err);
        setMessages([]);
      }
    };
    fetchMessages();

    // Setup socket.io
    socketRef.current = io('http://localhost:5000');
    socketRef.current.emit('joinWorkspace', workspaceId);

    socketRef.current.on('receiveMessage', (message) => {
      setMessages(prev => [...prev, {
        ...message,
        senderName: message.senderName || message.sender_name || (message.sender_id === localStorage.getItem('user_id') ? 'You' : 'User'),
      }]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [workspaceId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const token = localStorage.getItem('token');
    const sender_id = localStorage.getItem('user_id');
    const message = {
      workspace_id: workspaceId,
      sender_id,
      content: input,
    };
    // Emit to socket.io for real-time
    socketRef.current?.emit('sendMessage', message);
    // Optionally, save to DB via REST
    try {
      await axios.post('http://localhost:5000/api/messages/', message, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      console.error(err);
    }
    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      {/* Header */}
  <div className="sticky top-0 z-20 bg-white shadow-lg px-8 py-5 flex justify-between items-center rounded-b-3xl border-b border-purple-100">
        <div className="flex items-center gap-3">
          <span className="inline-block bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full px-4 py-2 text-2xl font-bold shadow-lg border-4 border-white">💬</span>
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 drop-shadow-lg tracking-tight">{workspaceName} Chat</h1>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-5 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 hover:bg-pink-700 transition-all duration-200"
        >
          ← Back
        </button>
      </div>

      {/* Chat Container */}
      <div className="flex-1 flex justify-center items-center">
  <div className="w-full max-w-4xl h-full flex flex-col justify-end">
          <div className="flex-1 overflow-y-auto px-2 py-8 space-y-4 bg-gradient-to-br from-white/95 via-purple-50 to-pink-50 backdrop-blur-2xl rounded-3xl shadow-2xl border border-purple-100">
            {messages.length === 0 && (
              <p className="text-gray-400 text-center mt-10 text-lg font-medium animate-pulse">No messages yet. Start chatting!</p>
            )}
            {(() => {
              let lastDate = null;
              return messages.map((msg, idx) => {
                const msgDate = msg.created_at ? new Date(msg.created_at) : null;
                let showDateSeparator = false;
                let dateLabel = '';
                if (msgDate) {
                  const dateStr = msgDate.toDateString();
                  if (lastDate !== dateStr) {
                    showDateSeparator = true;
                    const today = new Date();
                    const yesterday = new Date();
                    yesterday.setDate(today.getDate() - 1);
                    if (dateStr === today.toDateString()) {
                      dateLabel = 'Today';
                    } else if (dateStr === yesterday.toDateString()) {
                      dateLabel = 'Yesterday';
                    } else {
                      dateLabel = msgDate.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
                    }
                    lastDate = dateStr;
                  }
                }
                return (
                  <React.Fragment key={idx}>
                    {showDateSeparator && (
                      <div className="flex justify-center my-6">
                        <span className="bg-white/80 text-purple-600 px-5 py-1 rounded-full text-xs font-semibold shadow-md border border-purple-200 drop-shadow-lg tracking-wide" style={{letterSpacing: '0.5px'}}>
                          {dateLabel}
                        </span>
                      </div>
                    )}
                    <div
                      className={`relative max-w-[70%] px-5 py-3 rounded-2xl break-words shadow-lg transition-all duration-200 flex flex-col ${
                        msg.senderName === 'You'
                          ? 'bg-indigo-500 ml-auto text-white items-end'
                          : 'bg-white mr-auto text-gray-800 items-start'
                      } group hover:scale-[1.02]`}
                      style={{marginBottom: '1.2rem'}}
                    >
                      <span className={`font-semibold text-sm mb-1 ${msg.senderName === 'You' ? 'text-white' : 'text-purple-700'}`}>{msg.senderName || 'User'}</span>
                      <p className={`text-base font-normal leading-relaxed whitespace-pre-line ${msg.senderName === 'You' ? 'text-white' : 'text-gray-800'}`}>{msg.content || msg.text}</p>
                      {msg.created_at && (
                        <span className={`absolute bottom-2 right-4 text-[10px] font-medium ${msg.senderName === 'You' ? 'text-indigo-100' : 'text-gray-400'}`}
                          style={{marginTop: '2px'}}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </React.Fragment>
                );
              });
            })()}
            <div ref={messagesEndRef}></div>
          </div>

          {/* Input Bar */}
          <div className="mt-4 flex items-center gap-3 bg-white/90 backdrop-blur-xl shadow-lg rounded-2xl px-4 py-3 border border-purple-100">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 border-none rounded-xl p-3 bg-purple-50 text-gray-800 placeholder:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 text-base"
            />
            <button
              onClick={sendMessage}
              className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 hover:bg-indigo-700 transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
