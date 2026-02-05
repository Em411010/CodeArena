import { useState, useEffect } from 'react';
import { usersAPI, lobbiesAPI, sampleProblemsAPI, competitionProblemsAPI } from '../../services/api';
import { Users, FileCode, Trophy, Code, Loader2, TrendingUp, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    teachers: 0,
    students: 0,
    pendingTeachers: 0,
    lobbies: 0,
    sampleProblems: 0,
    competitionProblems: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [usersRes, lobbiesRes, sampleRes] = await Promise.all([
        usersAPI.getAll(),
        lobbiesAPI.getAll(),
        sampleProblemsAPI.getAll(),
      ]);

      const users = usersRes.data.data;
      setStats({
        users: users.length,
        teachers: users.filter(u => u.role === 'teacher').length,
        students: users.filter(u => u.role === 'student').length,
        pendingTeachers: users.filter(u => u.role === 'teacher' && !u.isApproved).length,
        lobbies: lobbiesRes.data.data?.length || 0,
        sampleProblems: sampleRes.data.data?.length || 0,
        competitionProblems: 0,
      });
    } catch (error) {
      toast.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    { label: 'Teachers', value: stats.teachers, icon: Code, color: 'text-green-400', bg: 'bg-green-500/20' },
    { label: 'Students', value: stats.students, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/20' },
    { label: 'Pending Approvals', value: stats.pendingTeachers, icon: Activity, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    { label: 'Total Lobbies', value: stats.lobbies, icon: Trophy, color: 'text-red-400', bg: 'bg-red-500/20' },
    { label: 'Sample Problems', value: stats.sampleProblems, icon: FileCode, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-400 mt-1">Platform overview and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-arena-card border border-arena-border rounded-xl p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{stat.label}</p>
                <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-arena-card border border-arena-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            href="/admin/users"
            className="flex items-center space-x-3 p-4 bg-arena-dark rounded-lg hover:bg-arena-border transition-colors"
          >
            <Users className="h-5 w-5 text-primary-400" />
            <span className="text-white">Manage Users</span>
          </a>
          <a
            href="/admin/users?filter=pending"
            className="flex items-center space-x-3 p-4 bg-arena-dark rounded-lg hover:bg-arena-border transition-colors"
          >
            <Activity className="h-5 w-5 text-yellow-400" />
            <span className="text-white">Review Pending Teachers ({stats.pendingTeachers})</span>
          </a>
          <a
            href="/practice"
            className="flex items-center space-x-3 p-4 bg-arena-dark rounded-lg hover:bg-arena-border transition-colors"
          >
            <FileCode className="h-5 w-5 text-green-400" />
            <span className="text-white">View Sample Problems</span>
          </a>
        </div>
      </div>

      {/* Platform Status */}
      <div className="bg-arena-card border border-arena-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Platform Status</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-arena-border">
            <span className="text-gray-400">Server Status</span>
            <span className="flex items-center space-x-2 text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span>Operational</span>
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-arena-border">
            <span className="text-gray-400">Database</span>
            <span className="flex items-center space-x-2 text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span>Connected</span>
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-gray-400">Code Execution Service</span>
            <span className="flex items-center space-x-2 text-yellow-400">
              <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
              <span>Mock Mode</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
