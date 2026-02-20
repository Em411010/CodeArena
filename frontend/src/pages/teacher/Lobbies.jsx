import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { lobbiesAPI } from '../../services/api';
import { Users, Plus, Loader2, Square, Trash2, Copy, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const TeacherLobbies = () => {
  const [lobbies, setLobbies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLobbies();
  }, []);

  const fetchLobbies = async () => {
    try {
      const { data } = await lobbiesAPI.getAll();
      setLobbies(data.data);
    } catch (error) {
      toast.error('Failed to load lobbies');
    } finally {
      setLoading(false);
    }
  };

  const handleEnd = async (id) => {
    if (!window.confirm('Are you sure you want to end this match?')) return;
    try {
      await lobbiesAPI.end(id);
      toast.success('Match ended');
      fetchLobbies();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to end match');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lobby?')) return;
    try {
      await lobbiesAPI.delete(id);
      setLobbies(lobbies.filter(l => l._id !== id));
      toast.success('Lobby deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete lobby');
    }
  };

  const copyAccessCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Access code copied!');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'WAITING': return 'bg-yellow-500/20 text-yellow-400';
      case 'ONGOING': return 'bg-green-500/20 text-green-400';
      case 'FINISHED': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Lobbies</h1>
          <p className="text-gray-400 mt-1">Create and manage competition lobbies</p>
        </div>
        <Link
          to="/teacher/lobbies/create"
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Lobby
        </Link>
      </div>

      {lobbies.length === 0 ? (
        <div className="bg-arena-card border border-arena-border rounded-xl p-12 text-center">
          <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">No lobbies yet</h3>
          <p className="text-gray-400 text-sm mb-4">
            Create your first lobby to host a competition
          </p>
          <Link
            to="/teacher/lobbies/create"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Lobby
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {lobbies.map((lobby) => (
            <div
              key={lobby._id}
              className="bg-arena-card border border-arena-border rounded-xl p-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-medium text-white">{lobby.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(lobby.status)}`}>
                      {lobby.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                    <span>{lobby.participants?.length || 0} participants</span>
                    <span>{lobby.duration} min</span>
                    <span>{lobby.problems?.length || 0} problems</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="bg-arena-dark rounded-lg px-4 py-2 flex items-center space-x-2">
                    <span className="text-gray-400 text-sm">Code:</span>
                    <span className="text-white font-mono font-bold tracking-widest">{lobby.accessCode}</span>
                    <button
                      onClick={() => copyAccessCode(lobby.accessCode)}
                      className="text-gray-400 hover:text-primary-400 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {lobby.status === 'WAITING' && (
                    <>
                      <Link
                        to={`/teacher/lobbies/${lobby._id}`}
                        className="inline-flex items-center px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Waiting Room
                      </Link>
                      <button
                        onClick={() => handleDelete(lobby._id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  {lobby.status === 'ONGOING' && (
                    <>
                      <Link
                        to={`/teacher/lobbies/${lobby._id}`}
                        className="inline-flex items-center px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Manage
                      </Link>
                      <button
                        onClick={() => handleEnd(lobby._id)}
                        className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Square className="h-4 w-4 mr-1" />
                        End
                      </button>
                    </>
                  )}
                  {lobby.status === 'FINISHED' && (
                    <Link
                      to={`/teacher/lobbies/${lobby._id}`}
                      className="inline-flex items-center px-3 py-1.5 bg-arena-dark text-gray-300 text-sm rounded-lg hover:bg-arena-border transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Results
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherLobbies;
