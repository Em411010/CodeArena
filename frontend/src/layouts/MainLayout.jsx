import { Outlet, Link } from 'react-router-dom';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      {/* Navigation */}
      <div className="navbar bg-base-300 border-b border-base-content/10">
        <div className="navbar-start">
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-300 rounded-box w-52 border border-base-content/10">
              <li><Link to="/login">Sign In</Link></li>
              <li><Link to="/register">Get Started</Link></li>
            </ul>
          </div>
          <Link to="/" className="btn btn-ghost text-xl gap-2">
            <img src="/logo.png" alt="CodeArena" className="h-7 w-7" />
            CodeArena
          </Link>
        </div>
        <div className="navbar-end hidden lg:flex gap-2">
          <Link to="/login" className="btn btn-ghost">
            Sign In
          </Link>
          <Link to="/register" className="btn btn-primary">
            Get Started
          </Link>
        </div>
      </div>

      {/* Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="footer footer-center p-6 bg-base-300 text-base-content border-t border-base-content/10">
        <aside>
          <div className="flex items-center gap-2 mb-2">
            <img src="/logo.png" alt="CodeArena" className="h-8 w-8" />
            <span className="font-bold">CodeArena</span>
          </div>
          <p>© 2026 CodeArena. All rights reserved.</p>
          <div className="flex items-center gap-2 mt-2 text-sm text-base-content/70">
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
        </aside>
        <nav>
          <div className="grid grid-flow-col gap-4">
            <a className="link link-hover">About</a>
            <a className="link link-hover">Terms</a>
            <a className="link link-hover">Privacy</a>
          </div>
        </nav>
      </footer>
    </div>
  );
};

export default MainLayout;
