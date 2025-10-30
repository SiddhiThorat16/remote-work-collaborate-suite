import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
// Nav brand logo
import logo from '@assets/TeleSync-Logo.png';
import avatar from '@assets/Avatar.png';

export default function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const avatarRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Close dropdown if clicking outside
    const handleClickOutside = (event) => {
      if (avatarRef.current && !avatarRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Example logout handler
  const handleLogout = () => {
    // Clear credentials, redirect, etc.
    navigate("/login");
  };

  return (
    <nav
      className="w-full py-0 bg-gradient-to-r from-indigo-300 via-purple-200 to-pink-200 shadow-xl"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        borderBottom: "1.5px solid #e0e0e0",
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-2">
        {/* Brand Logo */}
        <div className="flex items-center gap-5">
          <Link to="/" style={{display: "flex", alignItems: "center"}}>
            <img
              src={logo}
              alt="TeleSync Logo"
              style={{
                width: "110px",
                borderRadius: "22px",
                boxShadow: "0 4px 22px rgba(113, 58, 254, 0.13)",
                cursor: "pointer",
                transition: "transform 0.13s",
              }}
              className="hover:scale-105"
            />
            {/* <span className="ml-2 font-extrabold text-4xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 tracking-tight drop-shadow-lg" style={{letterSpacing: "0.03em"}}>
              TeleSync
            </span> */}
          </Link>
        </div>
        {/* Navigation Links */}
        <div className="flex items-center gap-7">
          <Link
            to="/My-Hub"
            className="font-semibold text-indigo-800 hover:text-purple-600 text-lg transition"
          >
            My Hub
          </Link>
          <Link
            to="/dashboard"
            className="font-semibold text-indigo-800 hover:text-pink-600 text-lg transition"
          >
            Workspaces
          </Link>
          <Link to="/login">
            <button
              className="px-5 py-2 mx-2 rounded-2xl font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg hover:scale-105 transition-all hover:ring-2 hover:ring-purple-400"
              style={{ fontSize: "18px" }}
            >
              Login
            </button>
          </Link>
          <Link to="/signup">
            <button
              className="px-5 py-2 rounded-2xl font-semibold text-white bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 shadow-lg hover:scale-105 transition-all hover:ring-2 hover:ring-pink-400 animate-pulse"
              style={{ fontSize: "18px" }}
            >
              Sign Up
            </button>
          </Link>
          {/* Profile Avatar Dropdown */}
          <div className="relative" ref={avatarRef}>
            <button
              className="flex items-center focus:outline-none"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-label="Profile"
              style={{
                borderRadius: "50%",
                boxShadow: "0 2px 8px rgba(113,58,254,0.10)",
                background: "linear-gradient(135deg, #c1c3fc 0%, #f9d4eb 100%)",
              }}
            >
              <img
                src={avatar}
                alt="Profile"
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  border: "2px solid #9254f7",
                  objectFit: "cover",
                  transition: "box-shadow 0.17s, transform 0.13s",
                }}
                className="hover:scale-105"
              />
            </button>
            {dropdownOpen && (
              <div
                className="absolute right-0 mt-3 w-56 rounded-2xl shadow-2xl animate-fade-in"
                style={{
                  background: "linear-gradient(135deg, #f4ebfe 0%, #f9d4eb 100%)",
                  border: "1px solid #d7c7fd",
                  zIndex: 1050,
                }}
              >
                <div className="px-5 py-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 pb-2 border-b" style={{borderColor: "#e0def7"}}>
                    <img
                      src={avatar}
                      alt="Profile"
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "50%",
                        border: "2px solid #9254f7",
                        objectFit: "cover",
                      }}
                    />
                    <div>
                      <span className="block font-semibold text-indigo-900 text-md">User Name</span>
                      <span className="block text-xs text-purple-500">Online</span>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    className="mt-3 px-3 py-2 rounded-lg font-medium text-indigo-800 hover:bg-pink-100 hover:text-pink-600 transition"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="px-3 py-2 rounded-lg font-medium text-indigo-800 hover:bg-purple-100 hover:text-purple-600 transition"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="mt-2 px-3 py-2 rounded-lg font-medium text-white bg-gradient-to-r from-pink-500 to-purple-500 shadow hover:scale-105 transition"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Utility animation for dropdown */}
      <style>{`
        .animate-fade-in {
          animation: fadeInDropdown 0.18s ease;
        }
        @keyframes fadeInDropdown {
          from { opacity: 0; transform: translateY(-13px);}
          to { opacity: 1; transform: translateY(0);}
        }
      `}</style>
    </nav>
  );
}
