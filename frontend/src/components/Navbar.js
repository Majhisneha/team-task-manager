import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="brand-icon">⬡</span>
        <span className="brand-text">TaskFlow</span>
      </Link>
      {user && (
        <div className="navbar-right">
          <span className="navbar-user">
            <span className="user-avatar">{user.name.charAt(0).toUpperCase()}</span>
            <span className="user-name">{user.name}</span>
          </span>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
