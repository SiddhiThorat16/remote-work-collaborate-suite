// src/Dashboard.jsx
import React from 'react';

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user')) || null;

  return (
    <div>
      <h1>Dashboard</h1>
      {user ? (
        <div>
          <p>Welcome, {user.name}!</p>
          <p>Your human_id: {user.human_id}</p>
        </div>
      ) : (
        <p>Please login to see your dashboard.</p>
      )}
    </div>
  );
};

export default Dashboard;
