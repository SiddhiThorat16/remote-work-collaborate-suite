import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = ({ setUser }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      const { token, user } = res.data;

  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('user_id', user.id); // Ensure user_id is set for chat
  if (setUser) setUser(user);
  navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-400 via-purple-300 to-pink-200 p-0">
      <div className="flex w-full max-w-4xl h-[650px] shadow-2xl rounded-3xl overflow-hidden border border-purple-200 bg-white/95 backdrop-blur-lg">
        {/* Left branding/illustration section */}
        <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-gradient-to-br from-purple-500 via-indigo-400 to-pink-300 text-white p-10 relative">
          <div className="absolute top-8 left-8 text-2xl font-extrabold tracking-tight drop-shadow-lg">TeleSync</div>
          <div className="flex flex-col items-center gap-6">
            <span className="inline-block bg-white/20 rounded-full px-8 py-6 text-5xl font-bold shadow-lg animate-bounce border-4 border-white">🔒</span>
            <span className="text-3xl font-extrabold text-white drop-shadow-lg text-center">Welcome Back!</span>
            <span className="text-lg text-white/80 text-center max-w-xs">Sign in to access your workspace, chat, and collaborate in real time.</span>
          </div>
        </div>
        {/* Right form section */}
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 md:p-16">
          <div className="w-full max-w-md">
            <div className="mb-10 text-center">
              <span className="inline-block bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full px-6 py-3 text-2xl font-bold shadow-lg border-4 border-white">🔒</span>
              <div className="mt-4 text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 drop-shadow-lg tracking-tight">Sign in to your account</div>
            </div>
            {error && <p className="text-red-500 text-center mb-4 font-semibold animate-pulse">{error}</p>}
            <form className="space-y-7" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-bold text-purple-700 flex items-center gap-1">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 12l-4-4-4 4m8 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6" /></svg>
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  autoComplete="username"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-5 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-purple-50 text-gray-800 placeholder:text-purple-300 transition-all duration-200 shadow-sm hover:border-indigo-400"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="text-sm font-bold text-purple-700 flex items-center gap-1">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0-1.104.896-2 2-2s2 .896 2 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2c0-1.104.896-2 2-2z" /></svg>
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-5 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-purple-50 text-gray-800 placeholder:text-purple-300 transition-all duration-200 shadow-sm hover:border-indigo-400"
                  required
                />
              </div>
              <button className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:scale-105 hover:bg-indigo-700 transition-all duration-200 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
                Login
              </button>
            </form>
            <div className="mt-10 text-center">
              <span className="text-gray-500">Don't have an account?</span>{' '}
              <a href="/signup" className="text-indigo-600 font-bold hover:underline hover:text-purple-700 transition">Sign Up</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
