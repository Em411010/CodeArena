import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { lobbiesAPI } from '../../services/api';
import { Trophy, Clock, Users, Loader2, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const MyMatches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const { data } = await lobbiesAPI.getMyMatches();
      setMatches(data.data);
    } catch (error) {
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'WAITING': return 'bg-yellow-500/20 text-yellow-400';
      case 'ONGOING': return 'bg-green-500/20 text-green-400';
      case 'FINISHED': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      <div>
        <h1 className="text-2xl font-bold text-white">My Matches</h1>
        <p className="text-gray-400 mt-1">View your competition history</p>
      </div>

      {matches.length === 0 ? (
        <div className="bg-arena-card border border-arena-border rounded-xl p-12 text-center">
          <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">No matches yet</h3>
          <p className="text-gray-400 text-sm mb-4">
            Join a match using an access code to get started
          </p>
          <Link
            to="/join"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Join a Match
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {matches.map((match) => (
            <div
              key={match._id}
              className="bg-arena-card border border-arena-border rounded-xl p-5 hover:border-arena-border/80 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-medium text-white">{match.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(match.status)}`}>
                      {match.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{match.participants?.length || 0} participants</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{match.duration} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(match.createdAt)}</span>
                    </div>
                  </div>
                  {match.teacher && (
                    <p className="text-gray-500 text-sm mt-2">
                      Hosted by {match.teacher.username}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {match.status === 'WAITING' && (
                    <Link
                      to={`/lobby/${match._id}`}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                    >
                      Waiting Room
                    </Link>
                  )}
                  {match.status === 'ONGOING' && (
                    <Link
                      to={`/match/${match._id}`}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Enter Match
                    </Link>
                  )}
                  {match.status === 'FINISHED' && (
                    <span className="px-4 py-2 bg-arena-dark text-gray-400 rounded-lg text-sm">
                      Completed
                    </span>
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

export default MyMatches;
