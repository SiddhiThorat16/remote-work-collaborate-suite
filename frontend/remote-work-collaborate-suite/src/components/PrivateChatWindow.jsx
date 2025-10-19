import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

// Ensure only a single socket is created
const socket = io('http://localhost:5000', { autoConnect: true });

const PrivateChatWindow = ({ user, onClose }) => {
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const myId = localStorage.getItem('user_id');

  // Find or create chat session (auth header added)
  useEffect(() => {
    if (!user) return;
    const myToken = localStorage.getItem('token');
    axios.post('/api/private-messages/find-or-create', {
      user1_id: myId,
      user2_id: user.id
    }, {
      headers: { Authorization: `Bearer ${myToken}` }
    }).then(res => {
      setChatId(res.data.chat.id);
    });
  }, [user, myId]);

  // Fetch messages and join room (auth header added)
  useEffect(() => {
    if (!chatId) return;
    socket.emit('joinPrivateChat', chatId);
    const myToken = localStorage.getItem('token');
    axios.get(`/api/private-messages/${chatId}/messages`, {
      headers: { Authorization: `Bearer ${myToken}` }
    }).then(res => {
      setMessages(res.data);
    });

    // Listen for incoming messages
    const onReceive = (msg) => {
      if (msg.chat_id === chatId) {
        setMessages(prev => [...prev, msg]);
      }
    };
    socket.on('receivePrivateMessage', onReceive);

    return () => {
      socket.emit('leavePrivateChat', chatId);
      socket.off('receivePrivateMessage', onReceive);
    };
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Optimistic update after send
  const sendMessage = async () => {
    if (!input.trim() || !chatId) return;
    const myToken = localStorage.getItem('token');
    try {
      const response = await axios.post(`/api/private-messages/${chatId}/send`, {
        sender_id: myId,
        content: input,
      }, {
        headers: { Authorization: `Bearer ${myToken}` }
      });
      setInput('');
      // Add the sent message immediately for sender's own view
      setMessages(prev => [...prev, response.data]);
      // You still get the message via socket for other users
    } catch (err) {
      alert('Message send failed');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-8 border border-purple-200 relative">
        <button className="absolute top-4 right-4 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg font-bold" onClick={onClose}>Close</button>
        <h2 className="text-2xl font-extrabold text-purple-700 mb-6 text-center">Chat with {user.human_id || user.name}</h2>
        <div className="flex flex-col h-[400px] overflow-y-auto mb-4 px-2 py-2 bg-purple-50 rounded-xl">
          {messages.map((msg, idx) => (
            <div key={idx} className={`mb-2 max-w-[70%] px-4 py-2 rounded-2xl shadow ${msg.sender_id === myId ? 'bg-indigo-500 text-white ml-auto' : 'bg-white text-purple-700 mr-auto'}`}>
              <span className="block text-xs font-semibold mb-1">{msg.sender?.human_id || msg.sender?.name || (msg.sender_id === myId ? 'You' : 'User')}</span>
              <span className="block text-base">{msg.content}</span>
              <span className="block text-[10px] text-right mt-1 text-gray-400">{msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
            </div>
          ))}
          <div ref={messagesEndRef}></div>
        </div>
        <div className="flex items-center gap-3 bg-white shadow rounded-xl px-4 py-3 border border-purple-100">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 border-none rounded-xl p-3 bg-purple-50 text-gray-800 placeholder:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 text-base"
          />
          <button
            onClick={sendMessage}
            className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 hover:bg-indigo-700 transition-all duration-200 flex items-center gap-2"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivateChatWindow;
