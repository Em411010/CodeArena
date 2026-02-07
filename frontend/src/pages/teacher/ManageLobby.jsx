import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lobbiesAPI, submissionsAPI } from '../../services/api';
import socketService from '../../services/socket';
import { ArrowLeft, Loader2, Trophy, Users, Clock, Copy, Square, Download, Eye, ArrowRight, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ManageLobby = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lobby, setLobby] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [quizBeeControl, setQuizBeeControl] = useState({
    currentProblem: 0,
    totalProblems: 0,
    timeExpired: false,
    problemRevealed: false
  });

  useEffect(() => {
    fetchData();
    
    // Connect to socket for quiz bee updates
    const socket = socketService.connect();
    socketService.joinLobby(id);

    socket.on('problem-time-expired', (data) => {
      if (data.lobbyId === id) {
        setQuizBeeControl(prev => ({ ...prev, timeExpired: true }));
        toast('⏰ Time is up for current problem!', { icon: '⏰' });
      }
    });

    socket.on('problem-change', (data) => {
      if (data.lobbyId === id) {
        fetchData();
        setQuizBeeControl(prev => ({
          ...prev,
          currentProblem: data.currentProblemIndex,
          timeExpired: false,
          problemRevealed: false
        }));
      }
    });

    return () => {
      socketService.leaveLobby(id);
      socket.off('problem-time-expired');
      socket.off('problem-change');
    };
  }, [id]);

  const fetchData = async () => {
    try {
      const [lobbyRes, leaderboardRes, submissionsRes] = await Promise.all([
        lobbiesAPI.getById(id),
        lobbiesAPI.getLeaderboard(id),
        submissionsAPI.getByLobby(id),
      ]);
      setLobby(lobbyRes.data.data);
      setLeaderboard(leaderboardRes.data.data);
      setSubmissions(submissionsRes.data.data);
    } catch (error) {
      toast.error('Failed to load lobby data');
      navigate('/teacher/lobbies');
    } finally {
      setLoading(false);
    }
  };

  const handleEnd = async () => {
    if (!window.confirm('Are you sure you want to end this match?')) return;
    try {
      await lobbiesAPI.end(id);
      toast.success('Match ended');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to end match');
    }
  };

  const handleRevealProblem = async () => {
    try {
      await lobbiesAPI.revealProblem(id);
      setQuizBeeControl(prev => ({ ...prev, problemRevealed: true }));
      toast.success('Problem revealed to participants!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reveal problem');
    }
  };

  const handleNextProblem = async () => {
    if (!window.confirm('Advance to the next problem?')) return;
    try {
      await lobbiesAPI.nextProblem(id);
      setQuizBeeControl(prev => ({
        ...prev,
        timeExpired: false,
        problemRevealed: false
      }));
      toast.success('Advanced to next problem!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to advance problem');
    }
  };

  const copyAccessCode = () => {
    navigator.clipboard.writeText(lobby.accessCode);
    toast.success('Access code copied!');
  };

  const exportResults = () => {
    const csv = [
      ['Rank', 'Username', 'Score', 'Problems Solved'],
      ...leaderboard.map(entry => [
        entry.rank,
        entry.user.username,
        entry.score,
        entry.solvedCount,
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lobby.name}-results.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Results exported!');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'WAITING': return 'bg-yellow-500/20 text-yellow-400';
      case 'ONGOING': return 'bg-green-500/20 text-green-400';
      case 'FINISHED': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getVerdictColor = (verdict) => {
    switch (verdict) {
      case 'ACCEPTED': return 'text-green-400';
      case 'WRONG_ANSWER': return 'text-red-400';
      case 'TIME_LIMIT_EXCEEDED': return 'text-yellow-400';
      default: return 'text-gray-400';
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
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/teacher/lobbies')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{lobby?.name}</h1>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(lobby?.status)}`}>
                {lobby?.status}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {lobby?.participants?.length || 0} participants
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {lobby?.duration} min
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-arena-dark rounded-lg px-4 py-2 flex items-center space-x-2">
            <span className="text-gray-400 text-sm">Code:</span>
            <span className="text-white font-mono font-bold">{lobby?.accessCode}</span>
            <button onClick={copyAccessCode} className="text-gray-400 hover:text-primary-400">
              <Copy className="h-4 w-4" />
            </button>
          </div>
          {lobby?.status === 'ONGOING' && (
            <button
              onClick={handleEnd}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Square className="h-4 w-4 mr-2" />
              End Match
            </button>
          )}
          <button
            onClick={exportResults}
            className="inline-flex items-center px-4 py-2 bg-arena-card text-gray-300 rounded-lg hover:bg-arena-border transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Quiz Bee Host Controls */}
      {lobby?.matchType === 'QUIZ_BEE' && lobby?.status === 'ONGOING' && (
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                🎯 Quiz Bee Host Controls
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                You control when problems are shown and when to advance
              </p>
            </div>
            {quizBeeControl.timeExpired && (
              <div className="flex items-center gap-2 bg-red-500/20 px-4 py-2 rounded-lg border border-red-500/50">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <span className="text-red-400 font-medium">Time Expired</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-arena-card rounded-lg p-4 border border-arena-border">
              <div className="text-sm text-gray-400 mb-1">Current Problem</div>
              <div className="text-2xl font-bold text-white">
                {(lobby.currentProblemIndex || 0) + 1} / {lobby.problems?.length || 0}
              </div>
            </div>

            <div className="bg-arena-card rounded-lg p-4 border border-arena-border">
              <div className="text-sm text-gray-400 mb-1">Time Per Problem</div>
              <div className="text-2xl font-bold text-white">
                {lobby.timePerProblem} min
              </div>
            </div>

            <div className="bg-arena-card rounded-lg p-4 border border-arena-border">
              <div className="text-sm text-gray-400 mb-1">Status</div>
              <div className="text-lg font-semibold">
                {quizBeeControl.problemRevealed ? (
                  <span className="text-green-400">Problem Revealed</span>
                ) : (
                  <span className="text-yellow-400">Waiting to Reveal</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleRevealProblem}
              disabled={quizBeeControl.problemRevealed}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <Eye className="h-5 w-5 mr-2" />
              {quizBeeControl.problemRevealed ? 'Problem Revealed' : 'Reveal Problem to Participants'}
            </button>
            
            <button
              onClick={handleNextProblem}
              disabled={(lobby.currentProblemIndex || 0) >= (lobby.problems?.length || 0) - 1}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <ArrowRight className="h-5 w-5 mr-2" />
              {(lobby.currentProblemIndex || 0) >= (lobby.problems?.length || 0) - 1 ? 'Last Problem' : 'Next Problem'}
            </button>
          </div>

          <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-300">
              💡 <strong>Tip:</strong> Click "Reveal Problem" to show the current problem to participants. 
              When ready, click "Next Problem" to advance. You have full control!
            </p>
          </div>
        </div>
      )}

      <div className="flex space-x-1 bg-arena-dark rounded-lg p-1">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'leaderboard'
              ? 'bg-arena-card text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Trophy className="h-4 w-4 inline mr-2" />
          Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'submissions'
              ? 'bg-arena-card text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Submissions ({submissions.length})
        </button>
        <button
          onClick={() => setActiveTab('participants')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'participants'
              ? 'bg-arena-card text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Users className="h-4 w-4 inline mr-2" />
          Participants
        </button>
      </div>

      <div className="bg-arena-card border border-arena-border rounded-xl overflow-hidden">
        {activeTab === 'leaderboard' && (
          <table className="w-full">
            <thead className="bg-arena-dark">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Solved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-arena-border">
              {leaderboard.map((entry) => (
                <tr key={entry.user._id} className="hover:bg-arena-dark/50">
                  <td className="px-6 py-4">
                    <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold ${
                      entry.rank === 1 ? 'bg-yellow-500 text-black' :
                      entry.rank === 2 ? 'bg-gray-400 text-black' :
                      entry.rank === 3 ? 'bg-orange-500 text-black' :
                      'bg-arena-border text-white'
                    }`}>
                      {entry.rank}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white font-medium">{entry.user.username}</td>
                  <td className="px-6 py-4 text-white font-bold">{entry.score}</td>
                  <td className="px-6 py-4 text-gray-400">{entry.solvedCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'submissions' && (
          <table className="w-full">
            <thead className="bg-arena-dark">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Problem</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Verdict</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Language</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-arena-border">
              {submissions.map((sub) => (
                <tr key={sub._id} className="hover:bg-arena-dark/50">
                  <td className="px-6 py-4 text-white">{sub.user?.username}</td>
                  <td className="px-6 py-4 text-gray-300">{sub.problem?.title}</td>
                  <td className={`px-6 py-4 font-medium ${getVerdictColor(sub.verdict)}`}>
                    {sub.verdict.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 text-white">{sub.score}</td>
                  <td className="px-6 py-4 text-gray-400 uppercase text-sm">{sub.language}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'participants' && (
          <table className="w-full">
            <thead className="bg-arena-dark">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Joined At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-arena-border">
              {lobby?.participants?.map((p, idx) => (
                <tr key={p.user._id} className="hover:bg-arena-dark/50">
                  <td className="px-6 py-4 text-gray-400">{idx + 1}</td>
                  <td className="px-6 py-4 text-white font-medium">{p.user.username}</td>
                  <td className="px-6 py-4 text-gray-400">
                    {new Date(p.joinedAt).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 text-white">{p.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ManageLobby;
