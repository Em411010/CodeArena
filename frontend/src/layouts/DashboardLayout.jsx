import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Code2,
  LayoutDashboard,
  BookOpen,
  Users,
  Trophy,
  Settings,
  LogOut,
  Menu,
  X,
  FileCode,
  DoorOpen,
  Shield,
  UserCog,
} from 'lucide-react';
import { useState } from 'react';

const DashboardLayout = () => {
  const { user, logout, isTeacher, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Practice', href: '/practice', icon: BookOpen },
    { name: 'Join Match', href: '/join', icon: DoorOpen },
    { name: 'My Matches', href: '/my-matches', icon: Trophy },
  ];

  const teacherItems = [
    { name: 'My Problems', href: '/teacher/problems', icon: FileCode },
    { name: 'My Lobbies', href: '/teacher/lobbies', icon: Users },
  ];

  const adminItems = [
    { name: 'Admin Dashboard', href: '/admin', icon: Shield },
    { name: 'Manage Users', href: '/admin/users', icon: UserCog },
  ];

  const isActive = (href) => location.pathname === href || location.pathname.startsWith(href + '/');

  const SidebarContent = ({ onLinkClick = () => {} }) => (
    <>
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-base-content/10">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src="/logo.png" alt="CodeArena" className="h-8 w-8" />
          <span className="text-xl font-bold">CodeArena</span>
        </Link>
      </div>

      {/* Navigation */}
      <ul className="menu p-4 w-full">
        {navItems.map((item) => (
          <li key={item.name}>
            <Link
              to={item.href}
              onClick={onLinkClick}
              className={isActive(item.href) ? 'active' : ''}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          </li>
        ))}

        {/* Teacher Section */}
        {(isTeacher || isAdmin) && (
          <>
            <li className="menu-title mt-4">Teacher</li>
            {teacherItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.href}
                  onClick={onLinkClick}
                  className={isActive(item.href) ? 'active' : ''}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            ))}
          </>
        )}

        {/* Admin Section */}
        {isAdmin && (
          <>
            <li className="menu-title mt-4">Admin</li>
            {adminItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.href}
                  onClick={onLinkClick}
                  className={isActive(item.href) ? 'active' : ''}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            ))}
          </>
        )}

        {/* Divider */}
        <li className="menu-title mt-4">Account</li>
        <li>
          <Link to="/profile" onClick={onLinkClick}>
            <Settings className="h-5 w-5" />
            Settings
          </Link>
        </li>
        <li>
          <button onClick={handleLogout} className="text-error hover:bg-error/20">
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </li>
      </ul>
    </>
  );

  return (
    <div className="drawer lg:drawer-open min-h-screen bg-base-200">
      <input
        id="sidebar-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={sidebarOpen}
        onChange={(e) => setSidebarOpen(e.target.checked)}
      />

      {/* Main Content */}
      <div className="drawer-content flex flex-col">
        {/* Navbar */}
        <header className="navbar bg-base-300 border-b border-base-content/10 lg:hidden">
          <div className="flex-none">
            <label htmlFor="sidebar-drawer" className="btn btn-square btn-ghost drawer-button">
              <Menu className="h-6 w-6" />
            </label>
          </div>
          <div className="flex-1">
            <Link to="/dashboard" className="flex items-center gap-2">
              <img src="/logo.png" alt="CodeArena" className="h-6 w-6" />
              <span className="font-bold">CodeArena</span>
            </Link>
          </div>
          <div className="flex-none">
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar placeholder">
                <div className="bg-primary text-primary-content rounded-full w-10">
                  <span>{user?.username?.charAt(0).toUpperCase()}</span>
                </div>
              </div>
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-300 rounded-box w-52 border border-base-content/10">
                <li className="menu-title">
                  <span>{user?.username}</span>
                  <span className="text-xs opacity-70 capitalize">{user?.role}</span>
                </li>
                <li><Link to="/profile">Profile Settings</Link></li>
                <li><button onClick={handleLogout} className="text-error">Logout</button></li>
              </ul>
            </div>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="navbar bg-base-300 border-b border-base-content/10 hidden lg:flex">
          <div className="flex-1"></div>
          <div className="flex-none">
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost gap-2">
                <div className="avatar placeholder">
                  <div className="bg-primary text-primary-content rounded-full w-8">
                    <span className="text-sm">{user?.username?.charAt(0).toUpperCase()}</span>
                  </div>
                </div>
                <span className="hidden sm:inline">{user?.username}</span>
              </div>
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-300 rounded-box w-52 border border-base-content/10">
                <li className="menu-title">
                  <div>
                    <span>{user?.username}</span>
                    <span className="text-xs opacity-70 capitalize block">{user?.role}</span>
                  </div>
                </li>
                <li><Link to="/profile">Profile Settings</Link></li>
                <li><button onClick={handleLogout} className="text-error">Logout</button></li>
              </ul>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="py-4 px-6 border-t border-base-content/10 bg-base-300">
          <div className="flex items-center justify-center gap-2 text-sm text-base-content/70">
            <span>Developed by</span>
            <a 
              href="https://github.com/Em411010" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              <span className="font-medium">Em411010</span>
            </a>
          </div>
        </footer>
      </div>

      {/* Sidebar */}
      <div className="drawer-side z-50">
        <label htmlFor="sidebar-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
        <aside className="bg-base-300 w-64 min-h-full border-r border-base-content/10">
          <div className="lg:hidden flex justify-end p-2">
            <label htmlFor="sidebar-drawer" className="btn btn-ghost btn-sm btn-circle">
              <X className="h-5 w-5" />
            </label>
          </div>
          <SidebarContent onLinkClick={() => setSidebarOpen(false)} />
        </aside>
      </div>
    </div>
  );
};

export default DashboardLayout;
