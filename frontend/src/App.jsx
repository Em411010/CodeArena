import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import OAuthCallback from './pages/OAuthCallback';

// Dashboard Pages
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';

// Practice Pages
import SampleProblems from './pages/practice/SampleProblems';
import ProblemSolver from './pages/practice/ProblemSolver';

// Lobby Pages
import JoinLobby from './pages/lobby/JoinLobby';
import LobbyWaiting from './pages/lobby/LobbyWaiting';
import MatchArena from './pages/lobby/MatchArena';
import MyMatches from './pages/lobby/MyMatches';

// Teacher Pages
import TeacherProblems from './pages/teacher/Problems';
import CreateProblem from './pages/teacher/CreateProblem';
import TeacherLobbies from './pages/teacher/Lobbies';
import CreateLobby from './pages/teacher/CreateLobby';
import ManageLobby from './pages/teacher/ManageLobby';

// Admin Pages
import AdminUsers from './pages/admin/Users';
import AdminDashboard from './pages/admin/Dashboard';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [], requireApproval = false }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireApproval && user.role === 'teacher' && !user.isApproved) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route - redirect to dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
      </Route>

      {/* Protected Dashboard Routes */}
      <Route element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />

        {/* Practice */}
        <Route path="/practice" element={<SampleProblems />} />
        <Route path="/practice/:id" element={<ProblemSolver />} />


        <Route path="/join" element={<JoinLobby />} />
        <Route path="/lobby/:id" element={<LobbyWaiting />} />
        <Route path="/match/:id" element={<MatchArena />} />
        <Route path="/my-matches" element={<MyMatches />} />

        {/* Teacher Routes */}
        <Route path="/teacher/problems" element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']} requireApproval>
            <TeacherProblems />
          </ProtectedRoute>
        } />
        <Route path="/teacher/problems/create" element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']} requireApproval>
            <CreateProblem />
          </ProtectedRoute>
        } />
        <Route path="/teacher/lobbies" element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']} requireApproval>
            <TeacherLobbies />
          </ProtectedRoute>
        } />
        <Route path="/teacher/lobbies/create" element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']} requireApproval>
            <CreateLobby />
          </ProtectedRoute>
        } />
        <Route path="/teacher/lobbies/:id" element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']} requireApproval>
            <ManageLobby />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminUsers />
          </ProtectedRoute>
        } />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div data-theme="codearena" className="min-h-screen bg-base-200">
          <AppRoutes />
          <Toaster
            position="top-right"
            gutter={12}
            containerStyle={{ top: 20 }}
            toastOptions={{
              duration: 4000,
              className: 'toast-custom',
              style: {
                background: 'var(--fallback-b3,oklch(var(--b3)/1))',
                color: 'var(--fallback-bc,oklch(var(--bc)/1))',
                border: '1px solid var(--fallback-n,oklch(var(--n)/0.2))',
                padding: '12px 16px',
                borderRadius: '0.5rem',
              },
              success: {
                iconTheme: {
                  primary: 'var(--fallback-su,oklch(var(--su)/1))',
                  secondary: '#fff',
                },
                style: {
                  borderLeft: '4px solid var(--fallback-su,oklch(var(--su)/1))',
                },
              },
              error: {
                iconTheme: {
                  primary: 'var(--fallback-er,oklch(var(--er)/1))',
                  secondary: '#fff',
                },
                style: {
                  borderLeft: '4px solid var(--fallback-er,oklch(var(--er)/1))',
                },
              },
              loading: {
                iconTheme: {
                  primary: 'var(--fallback-p,oklch(var(--p)/1))',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
