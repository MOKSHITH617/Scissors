import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, Users, CalendarCheck, HelpCircle, 
  TrendingUp, Settings, ChevronLeft, ChevronRight, 
  LogOut, Scissors, UserCheck
} from 'lucide-react';
import SettingsDrawer from './SettingsDrawer';
import './AdminLayout.css';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Collapse sidebar state
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Appointments', path: '/admin/appointments', icon: CalendarCheck },
    { name: 'Follow-ups', path: '/admin/followups', icon: HelpCircle },
    { name: 'Insights', path: '/admin/insights', icon: TrendingUp },
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const getPageTitle = () => {
    const currentPath = location.pathname;
    const matchedItem = menuItems.find(item => item.path === currentPath);
    return matchedItem ? matchedItem.name : 'CRM Dashboard';
  };

  return (
    <div className="admin-layout-root">
      
      {/* Dark Sidebar */}
      <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
        
        {/* Brand Logo */}
        <div className="sidebar-logo">
          <Scissors className="sidebar-logo-icon" />
          {!collapsed && (
            <div className="sidebar-logo-text animate-fade-in-simple">
              <span className="logo-title">SCISSOR LINES</span>
              <span className="logo-tag">CRM PLATFORM</span>
            </div>
          )}
        </div>

        {/* Sidebar Nav Links */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                title={collapsed ? item.name : undefined}
              >
                <Icon size={18} className="link-icon" />
                {!collapsed && <span className="link-label animate-fade-in-simple">{item.name}</span>}
              </Link>
            );
          })}

          {/* More trigger */}
          <button
            type="button"
            className="sidebar-link more-btn"
            onClick={() => setSettingsOpen(true)}
            title={collapsed ? 'Settings & More' : undefined}
          >
            <Settings size={18} className="link-icon" />
            {!collapsed && <span className="link-label animate-fade-in-simple">More Menu</span>}
          </button>
        </nav>

        {/* Collapse Control Button */}
        <button 
          className="sidebar-collapse-toggle" 
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Collapse sidebar"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Sidebar footer user context */}
        <div className="sidebar-footer">
          <div className="user-pill">
            <UserCheck size={16} className="user-icon" />
            {!collapsed && (
              <div className="user-details animate-fade-in-simple">
                <span className="user-name">{user?.name || 'Administrator'}</span>
                <span className="user-role">Owner</span>
              </div>
            )}
          </div>
          <button 
            onClick={handleLogout} 
            className="logout-link"
            title="Log Out"
          >
            <LogOut size={16} />
            {!collapsed && <span className="animate-fade-in-simple">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content right panel */}
      <div className="admin-main-panel">
        
        {/* Top Headerbar */}
        <header className="admin-header">
          <div className="header-left">
            <h2 className="header-page-title">{getPageTitle()}</h2>
            <span className="header-date">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <div className="header-right">
            <Link to="/" className="btn btn-outline-gold header-view-site-btn">
              View Public Site
            </Link>
          </div>
        </header>

        {/* Content routing container */}
        <main className="admin-content-area animate-fade-in-simple">
          <Outlet />
        </main>
      </div>

      {/* Settings & More Side Drawer Component */}
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};

export default AdminLayout;
