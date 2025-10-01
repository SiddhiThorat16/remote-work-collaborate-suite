import React from "react";
import { Link } from "react-router-dom";

const Home = () => {

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-400 via-purple-300 to-pink-200 p-0">
      <div className="flex flex-col items-center justify-center w-full max-w-3xl bg-white/95 shadow-2xl rounded-3xl px-10 py-16 border border-purple-200 backdrop-blur-lg">
        <div className="mb-10 text-center">
          <span className="inline-block bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full px-6 py-3 text-3xl font-bold shadow-lg border-4 border-white">🚀</span>
          <div className="mt-4 text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 drop-shadow-lg tracking-tight">Welcome to Remote Work Suite</div>
          <div className="mt-2 text-lg text-gray-500 font-medium">Collaborate, chat, and create in real time.</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mt-8">
          <Link to="/login" className="flex flex-col items-center bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl p-8 shadow transition-all duration-200">
            <span className="text-2xl mb-2">🔒</span>
            <span className="font-bold text-purple-700">Login</span>
            <span className="text-sm text-gray-500 mt-2">Access your workspace</span>
          </Link>
          <Link to="/signup" className="flex flex-col items-center bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl p-8 shadow transition-all duration-200">
            <span className="text-2xl mb-2">📝</span>
            <span className="font-bold text-indigo-700">Sign Up</span>
            <span className="text-sm text-gray-500 mt-2">Create a new account</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;