import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usersAPI } from '../../services/api';
import { Users, Search, Shield, CheckCircle, XCircle, Loader2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState(searchParams.get('filter') === 'pending' ? 'teacher' : 'all');
  const [showPendingOnly, setShowPendingOnly] = useState(searchParams.get('filter') === 'pending');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await usersAPI.getAll();
      setUsers(data.data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await usersAPI.approve(userId);
      setUsers(users.map(u => u._id === userId ? { ...u, isApproved: true } : u));
      toast.success('Teacher approved');
    } catch (error) {
      toast.error('Failed to approve teacher');
    }
  };

  const handleUpdateRole = async (userId, role) => {
    try {
      await usersAPI.update(userId, { role });
      setUsers(users.map(u => u._id === userId ? { ...u, role } : u));
      toast.success('Role updated');
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await usersAPI.delete(userId);
      setUsers(users.filter(u => u._id !== userId));
      toast.success('User deleted');
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-400';
      case 'teacher':
        return 'bg-blue-500/20 text-blue-400';
      case 'student':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesPending = !showPendingOnly || (user.role === 'teacher' && !user.isApproved);
    return matchesSearch && matchesRole && matchesPending;
  });

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
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="text-gray-400 mt-1">Manage users and approve teacher accounts</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by username or email..."
            className="w-full pl-10 pr-4 py-2 bg-arena-card border border-arena-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2 bg-arena-card border border-arena-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Roles</option>
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
          <option value="admin">Admins</option>
        </select>
        <label className="flex items-center space-x-2 px-4 py-2 bg-arena-card border border-arena-border rounded-lg">
          <input
            type="checkbox"
            checked={showPendingOnly}
            onChange={(e) => setShowPendingOnly(e.target.checked)}
            className="rounded border-arena-border bg-arena-dark text-primary-600 focus:ring-primary-500"
          />
          <span className="text-gray-300">Pending Only</span>
        </label>
      </div>

      {/* Users Table */}
      <div className="bg-arena-card border border-arena-border rounded-xl overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No users found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-arena-dark">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase hidden sm:table-cell">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase hidden md:table-cell">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-arena-border">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-arena-dark/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center">
                        <span className="text-primary-400 font-medium text-sm">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-white font-medium">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className="text-gray-400">{user.email}</span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleUpdateRole(user._id, e.target.value)}
                      className={`px-2 py-1 rounded text-xs font-medium border-0 ${getRoleBadge(user.role)}`}
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    {user.role === 'teacher' ? (
                      user.isApproved ? (
                        <span className="flex items-center text-green-400 text-sm">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approved
                        </span>
                      ) : (
                        <span className="flex items-center text-yellow-400 text-sm">
                          <Shield className="h-4 w-4 mr-1" />
                          Pending
                        </span>
                      )
                    ) : (
                      <span className="text-gray-500 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {user.role === 'teacher' && !user.isApproved && (
                        <button
                          onClick={() => handleApprove(user._id)}
                          className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>Showing {filteredUsers.length} of {users.length} users</span>
        <span>
          {users.filter(u => u.role === 'teacher' && !u.isApproved).length} pending approvals
        </span>
      </div>
    </div>
  );
};

export default AdminUsers;
