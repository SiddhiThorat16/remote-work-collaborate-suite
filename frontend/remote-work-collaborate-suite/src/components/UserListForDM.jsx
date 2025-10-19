// frontend/remote-work-collaborate-suite/src/components/UserListForDM.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const UserListForDM = ({ onSelectUser }) => {
  const [users, setUsers] = useState([]);
  const myId = localStorage.getItem('user_id');

  useEffect(() => {
    // Fetch all users except self
    const token = localStorage.getItem('token');
    axios.get('http://localhost:5000/api/workspaces/all-users', {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    })
      .then(res => {
        const allUsers = res.data.users.filter(u => u.id !== myId);
        setUsers(allUsers);
      })
      .catch(() => setUsers([]));
  }, [myId]);

  return (
    <div className="p-4 bg-white rounded-2xl shadow-lg">
      <h3 className="text-lg font-bold mb-3 text-purple-700">Start a Private Chat</h3>
      <ul className="space-y-2">
        {users.map(user => (
          <li key={user.id}>
            <button
              className="w-full text-left px-4 py-2 rounded-lg bg-purple-50 hover:bg-purple-200 text-purple-700 font-semibold shadow"
              onClick={() => onSelectUser(user)}
            >
              {user.human_id || user.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserListForDM;