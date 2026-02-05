import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Trophy,
  DoorOpen,
  FileCode,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

const Dashboard = () => {
  const { user, isTeacher, isAdmin, isApproved } = useAuth();

  const studentQuickActions = [
    {
      title: 'Practice Problems',
      description: 'Solve sample problems to improve your skills',
      icon: BookOpen,
      href: '/practice',
      color: 'bg-success/20 text-success',
    },
    {
      title: 'Join Match',
      description: 'Enter an access code to join a competition',
      icon: DoorOpen,
      href: '/join',
      color: 'bg-primary/20 text-primary',
    },
    {
      title: 'My Matches',
      description: 'View your competition history',
      icon: Trophy,
      href: '/my-matches',
      color: 'bg-warning/20 text-warning',
    },
  ];

  const teacherQuickActions = [
    {
      title: 'My Problems',
      description: 'Create and manage competition problems',
      icon: FileCode,
      href: '/teacher/problems',
      color: 'bg-secondary/20 text-secondary',
    },
    {
      title: 'My Lobbies',
      description: 'Create and manage competition lobbies',
      icon: Users,
      href: '/teacher/lobbies',
      color: 'bg-accent/20 text-accent',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="card bg-base-300">
        <div className="card-body">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="card-title text-2xl">
                Welcome back, {user?.username}! 👋
              </h1>
              <p className="text-base-content/70 mt-1">
                {isAdmin && "You have full admin access to the platform."}
                {isTeacher && isApproved && "Create problems and manage competitions."}
                {isTeacher && !isApproved && "Your teacher account is pending approval."}
                {!isTeacher && !isAdmin && "Ready to code? Jump into practice or join a match."}
              </p>
            </div>
            <div className="hidden sm:block">
              <div className={`badge badge-lg capitalize ${
                isAdmin ? 'badge-error' :
                isTeacher ? 'badge-secondary' :
                'badge-success'
              }`}>
                {user?.role}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isTeacher && !isApproved && (
        <div className="alert alert-warning">
          <AlertCircle className="h-5 w-5" />
          <div>
            <h3 className="font-bold">Account Pending Approval</h3>
            <p className="text-sm">
              Your teacher account is awaiting admin approval. Once approved, you'll be able to 
              create problems and manage competitions. You can still practice with sample problems.
            </p>
          </div>
        </div>
      )}

      <div className="stats stats-vertical lg:stats-horizontal shadow w-full bg-base-300">
        <div className="stat">
          <div className="stat-figure text-success">
            <CheckCircle className="h-8 w-8" />
          </div>
          <div className="stat-title">Problems Solved</div>
          <div className="stat-value text-success">{user?.stats?.problemsSolved || 0}</div>
        </div>
        <div className="stat">
          <div className="stat-figure text-primary">
            <Trophy className="h-8 w-8" />
          </div>
          <div className="stat-title">Matches Participated</div>
          <div className="stat-value text-primary">{user?.stats?.matchesParticipated || 0}</div>
        </div>
        <div className="stat">
          <div className="stat-figure text-warning">
            <TrendingUp className="h-8 w-8" />
          </div>
          <div className="stat-title">Total Score</div>
          <div className="stat-value text-warning">{user?.stats?.totalScore || 0}</div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {studentQuickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="card bg-base-300 hover:bg-base-300/80 transition-all hover:shadow-lg group"
            >
              <div className="card-body">
                <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-2`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <h3 className="card-title text-base group-hover:text-primary transition-colors">
                  {action.title}
                </h3>
                <p className="text-base-content/70 text-sm">{action.description}</p>
              </div>
            </Link>
          ))}

          {(isTeacher || isAdmin) && isApproved && teacherQuickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="card bg-base-300 hover:bg-base-300/80 transition-all hover:shadow-lg group"
            >
              <div className="card-body">
                <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-2`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <h3 className="card-title text-base group-hover:text-primary transition-colors">
                  {action.title}
                </h3>
                <p className="text-base-content/70 text-sm">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>


      <div className="card bg-base-300">
        <div className="card-body">
          <h2 className="card-title">Recent Activity</h2>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-base-content/30 mx-auto mb-3" />
            <p className="text-base-content/70">No recent activity yet</p>
            <p className="text-base-content/50 text-sm mt-1">
              Start solving problems to see your activity here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
