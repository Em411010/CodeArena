import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, Crown, Medal, ArrowLeft, Loader2 } from 'lucide-react';
import { lobbiesAPI } from '../../services/api';
import socketService from '../../services/socket';

const LeaderboardPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lobby, setLobby] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    const socket = socketService.connect();
    socketService.joinLobby(id);

    socketService.onLeaderboardUpdate(() => {
      fetchLeaderboard();
    });

    socketService.onMatchEnded(() => {
      fetchData();
    });

    return () => {
      socketService.leaveLobby(id);
      socketService.removeAllListeners();
    };
  }, [id]);

  const fetchData = async () => {
    try {
      const [lobbyRes, leaderboardRes] = await Promise.all([
        lobbiesAPI.getById(id),
        lobbiesAPI.getLeaderboard(id)
      ]);
      setLobby(lobbyRes.data.data);
      setLeaderboard(leaderboardRes.data.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const { data } = await lobbiesAPI.getLeaderboard(id);
      setLeaderboard(data.data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const winner = leaderboard[0];
  const isMatchEnded = lobby?.status === 'COMPLETED';

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/my-matches')}
        className="mb-6 flex items-center text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to My Matches
      </button>

      <div className="bg-arena-card rounded-lg border border-arena-border p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-500/20 rounded-full mb-4">
            <Trophy className="h-10 w-10 text-yellow-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isMatchEnded ? 'Match Completed!' : 'Current Rankings'}
          </h1>
          <p className="text-gray-400">
            {lobby?.name}
          </p>
          {!isMatchEnded && (
            <p className="text-sm text-yellow-400 mt-2">
              Match is still ongoing. Rankings may change!
            </p>
          )}
        </div>

        {isMatchEnded && winner && (
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-lg p-6 mb-8 text-center">
            <Crown className="h-12 w-12 text-yellow-400 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white mb-1">
              {winner.user.username}
            </h2>
            <p className="text-yellow-400 text-lg">
              Winner with {winner.score} points!
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Solved {winner.solvedCount} out of {lobby?.problems?.length || 0} problems
            </p>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Trophy className="h-5 w-5 text-yellow-400 mr-2" />
            Leaderboard
          </h3>
          {leaderboard.map((entry, idx) => (
            <div
              key={entry.user._id}
              className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                idx === 0 ? 'bg-yellow-500/20 border-2 border-yellow-500/50' :
                idx === 1 ? 'bg-gray-400/20 border-2 border-gray-400/50' :
                idx === 2 ? 'bg-orange-500/20 border-2 border-orange-500/50' :
                'bg-arena-dark border border-arena-border'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                  idx === 0 ? 'bg-yellow-500 text-black' :
                  idx === 1 ? 'bg-gray-400 text-black' :
                  idx === 2 ? 'bg-orange-500 text-black' :
                  'bg-arena-border text-white'
                }`}>
                  {idx === 0 ? <Crown className="h-6 w-6" /> : 
                   idx === 1 || idx === 2 ? <Medal className="h-6 w-6" /> :
                   entry.rank}
                </div>
                <div>
                  <p className="text-white font-bold text-lg">{entry.user.username}</p>
                  <p className="text-gray-400 text-sm">
                    {entry.solvedCount} / {lobby?.problems?.length || 0} problems solved
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold text-2xl ${
                  idx === 0 ? 'text-yellow-400' :
                  idx === 1 ? 'text-gray-300' :
                  idx === 2 ? 'text-orange-400' :
                  'text-white'
                }`}>
                  {entry.score}
                </p>
                <p className="text-gray-400 text-sm">points</p>
              </div>
            </div>
          ))}
        </div>

        {leaderboard.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No submissions yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
