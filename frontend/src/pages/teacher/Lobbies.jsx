import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { lobbiesAPI } from '../../services/api';
import { Users, Plus, Loader2, Square, Trash2, Copy, Eye, Timer } from 'lucide-react';
import toast from 'react-hot-toast';

const CountdownTimer = ({ endTime }) => {
  const calcRemaining = () => Math.max(0, Math.floor((new Date(endTime) - Date.now()) / 1000));
  const [remaining, setRemaining] = useState(calcRemaining);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining(calcRemaining());
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [endTime]);

  if (!endTime) return null;

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  const formatted = h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
  const isLow = remaining <= 60;

  return (
    <div className={`flex items-center gap-1.5 text-sm font-mono font-semibold ${
      isLow ? 'text-red-400 animate-pulse' : remaining <= 300 ? 'text-yellow-400' : 'text-green-400'
    }`}>
      <Timer className="h-4 w-4" />
      {remaining === 0 ? 'Ending...' : formatted}
    </div>
  );
};

const TeacherLobbies = () => {
  const [lobbies, setLobbies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

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
      setLobbies(prev => prev.filter(l => l._id !== id));
      setSelected(prev => { const s = new Set(prev); s.delete(id); return s; });
      toast.success('Lobby deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete lobby');
    }
  };

  const deletableLobbies = lobbies.filter(l => l.status !== 'ONGOING');

  const toggleSelect = (id) => {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === deletableLobbies.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(deletableLobbies.map(l => l._id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} selected ${selected.size === 1 ? 'lobby' : 'lobbies'}? This cannot be undone.`)) return;
    setBulkDeleting(true);
    const ids = [...selected];
    let failed = 0;
    for (const id of ids) {
      try {
        await lobbiesAPI.delete(id);
      } catch {
        failed++;
      }
    }
    setBulkDeleting(false);
    setSelected(new Set());
    await fetchLobbies();
    if (failed === 0) toast.success(`Deleted ${ids.length} ${ids.length === 1 ? 'lobby' : 'lobbies'}`);
    else toast.error(`${failed} deletion(s) failed`);
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
        <>
          {deletableLobbies.length > 0 && (
            <div className="flex items-center gap-4 bg-arena-card border border-arena-border rounded-xl px-5 py-3">
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={selected.size === deletableLobbies.length && deletableLobbies.length > 0}
                onChange={toggleSelectAll}
              />
              <span className="text-gray-400 text-sm">
                {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
              </span>
              {selected.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors ml-2"
                >
                  {bulkDeleting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
                  Delete Selected
                </button>
              )}
            </div>
          )}

          <div className="grid gap-4">
            {lobbies.map((lobby) => {
              const isDeletable = lobby.status !== 'ONGOING';
              const isSelected = selected.has(lobby._id);
              return (
                <div
                  key={lobby._id}
                  className={`bg-arena-card border rounded-xl p-5 transition-colors ${isSelected ? 'border-red-500/50' : 'border-arena-border'}`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {isDeletable && (
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm flex-shrink-0"
                          checked={isSelected}
                          onChange={() => toggleSelect(lobby._id)}
                        />
                      )}
                      <div className="min-w-0">
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
                          {lobby.status === 'ONGOING' && lobby.endTime && (
                            <CountdownTimer endTime={lobby.endTime} />
                          )}
                        </div>
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
                        <>
                          <Link
                            to={`/teacher/lobbies/${lobby._id}`}
                            className="inline-flex items-center px-3 py-1.5 bg-arena-dark text-gray-300 text-sm rounded-lg hover:bg-arena-border transition-colors"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Results
                          </Link>
                          <button
                            onClick={() => handleDelete(lobby._id)}
                            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete lobby"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default TeacherLobbies;
