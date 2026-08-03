import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Scissors, Lock, Mail } from 'lucide-react';
import './Login.css';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate('/admin/dashboard');
    }
  };

  return (
    <div className="login-root animate-fade-in-simple">
      <div className="login-card-wrapper glass-card-dark">
        <div className="login-header">
          <div className="login-logo-circle">
            <Scissors className="login-logo-icon" />
          </div>
          <h1 className="login-brand">SCISSOR LINES</h1>
          <span className="login-subtitle">ADMIN CRM PORTAL</span>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="login-email">Email Address</label>
            <div className="input-with-icon">
              <Mail className="input-icon" size={16} />
              <input 
                type="email" 
                id="login-email" 
                required
                className="form-control dark-input" 
                placeholder="admin@scissorlines.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <div className="input-with-icon">
              <Lock className="input-icon" size={16} />
              <input 
                type="password" 
                id="login-password" 
                required
                className="form-control dark-input" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-gold login-submit-btn" disabled={loading}>
            {loading ? (
              <div className="spinner" style={{ width: '1.2rem', height: '1.2rem', borderTopColor: '#121212' }}></div>
            ) : (
              'Enter Dashboard'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>Scissor Lines © 2026</p>
          <a href="/" className="back-website-link">Back to Public Website</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
