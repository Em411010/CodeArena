import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Save, Loader2 } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    bio: user?.profile?.bio || '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await updateProfile(formData);
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
        <p className="text-gray-400 mt-1">Manage your account information</p>
      </div>

      {/* Account Info Card */}
      <div className="bg-arena-card border border-arena-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Account Information</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-white font-medium">{user?.username}</p>
              <p className="text-gray-400 text-sm">{user?.email}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium capitalize ${
                user?.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                user?.role === 'teacher' ? 'bg-purple-500/20 text-purple-400' :
                'bg-green-500/20 text-green-400'
              }`}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-arena-card border border-arena-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Profile Details</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                className="block w-full px-4 py-3 bg-arena-dark border border-arena-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="John"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                className="block w-full px-4 py-3 bg-arena-dark border border-arena-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              value={formData.bio}
              onChange={handleChange}
              className="block w-full px-4 py-3 bg-arena-dark border border-arena-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </form>
      </div>

      {/* Stats Card */}
      <div className="bg-arena-card border border-arena-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Statistics</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{user?.stats?.problemsSolved || 0}</p>
            <p className="text-gray-400 text-sm">Problems Solved</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{user?.stats?.matchesParticipated || 0}</p>
            <p className="text-gray-400 text-sm">Matches</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{user?.stats?.totalScore || 0}</p>
            <p className="text-gray-400 text-sm">Total Score</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
