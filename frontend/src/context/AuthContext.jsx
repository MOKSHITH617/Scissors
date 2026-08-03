import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('scissor_token'));
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Setup toast notifications helper
  const addToast = (message, type = 'success', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  // Configure fetch headers helper
  const authFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Automatic logout if unauthorized token
      logout();
      addToast('Session expired. Please log in again.', 'warning');
      throw new Error('Unauthorized');
    }

    return response;
  };

  // Check login state on boot
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [token]);

  // Login handler
  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        setUser({ _id: data._id, name: data.name, email: data.email });
        localStorage.setItem('scissor_token', data.token);
        addToast(`Welcome back, ${data.name}!`, 'success');
        return { success: true };
      } else {
        addToast(data.message || 'Login failed', 'error');
        return { success: false, message: data.message };
      }
    } catch (err) {
      addToast('Network error, please try again.', 'error');
      return { success: false, message: 'Server unreachable' };
    }
  };

  // Logout handler
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('scissor_token');
    addToast('Logged out successfully', 'success');
  };

  // Register helper (only for first user seeding)
  const registerFirstAdmin = async (name, email, password) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        setUser({ _id: data._id, name: data.name, email: data.email });
        localStorage.setItem('scissor_token', data.token);
        addToast('Admin account registered successfully!', 'success');
        return { success: true };
      } else {
        addToast(data.message || 'Registration failed', 'error');
        return { success: false, message: data.message };
      }
    } catch (err) {
      addToast('Network error, please try again.', 'error');
      return { success: false, message: 'Server unreachable' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        authFetch,
        addToast,
        registerFirstAdmin
      }}
    >
      {children}
      {/* Toast Notification HUD */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </AuthContext.Provider>
  );
};
