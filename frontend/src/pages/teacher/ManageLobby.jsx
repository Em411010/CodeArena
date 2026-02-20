import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lobbiesAPI, submissionsAPI } from '../../services/api';
import socketService from '../../services/socket';
import { ArrowLeft, Loader2, Trophy, Users, Clock, Copy, Square, Download, Eye, ArrowRight, AlertCircle, Play } from 'lucide-react';
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
  const [problemTimeLeft, setProblemTimeLeft] = useState(0);

  // Simple countdown timer ref
  const timerRef = useRef(null);

  const startCountdown = (seconds) => {
    // Clear any existing timer
    if (timerRef.current) clearInterval(timerRef.current);
    
    let remaining = seconds;
    setProblemTimeLeft(remaining);
    
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setProblemTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setProblemTimeLeft(0);
        setQuizBeeControl(prev => ({ ...prev, timeExpired: true, problemRevealed: false }));
        toast('⏰ Time is up for current problem!', { icon: '⏰' });
      }
    }, 1000);
  };

  const stopCountdown = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    fetchData();
    
    const socket = socketService.connect();
    socketService.joinLobby(id);

    // Real-time leaderboard & submissions refresh
    socket.on('leaderboard-update', (data) => {
      if (data.lobbyId === id) {
        fetchLeaderboardAndSubmissions();
      }
    });

    socket.on('participant-joined', (data) => {
      if (data.lobbyId === id) {
        // Refresh lobby to get updated participants list
        fetchData(true);
      }
    });

    socket.on('problem-time-expired', (data) => {
      if (data.lobbyId === id) {
        stopCountdown();
        setProblemTimeLeft(0);
        setQuizBeeControl(prev => ({ ...prev, timeExpired: true, problemRevealed: false }));
        toast('⏰ Time is up for current problem!', { icon: '⏰' });
      }
    });

    socket.on('problem-change', (data) => {
      if (data.lobbyId === id) {
        stopCountdown();
        console.log('[ManageLobby] problem-change timePerProblem:', data.timePerProblem);
        // Show full time for the next problem (timer not started yet)
        setProblemTimeLeft(data.timePerProblem ? data.timePerProblem * 60 : 0);
        setQuizBeeControl(prev => ({
          ...prev,
          currentProblem: data.currentProblemIndex,
          totalProblems: data.totalProblems,
          timeExpired: false,
          problemRevealed: false
        }));
        // Use skipTimer=true so fetchData doesn't override socket-managed timer state
        fetchData(true);
      }
    });

    socket.on('problem-revealed', (data) => {
      if (data.lobbyId === id) {
        console.log('[ManageLobby] problem-revealed timePerProblem:', data.timePerProblem);
        setQuizBeeControl(prev => ({ ...prev, problemRevealed: true, timeExpired: false }));
        // Start the countdown from timePerProblem
        if (data.timePerProblem) {
          startCountdown(data.timePerProblem * 60);
        }
        // Use skipTimer=true so fetchData doesn't restart/override the countdown
        fetchData(true);
      }
    });

    return () => {
      stopCountdown();
      socketService.leaveLobby(id);
      socket.off('leaderboard-update');
      socket.off('participant-joined');
      socket.off('problem-time-expired');
      socket.off('problem-change');
      socket.off('problem-revealed');
    };
  }, [id]);

  // skipTimer: when true, only refresh data without touching timer/reveal state
  // This prevents race conditions when called from socket handlers
  const fetchData = async (skipTimer = false) => {
    try {
      const [lobbyRes, leaderboardRes, submissionsRes] = await Promise.all([
        lobbiesAPI.getById(id),
        lobbiesAPI.getLeaderboard(id),
        submissionsAPI.getByLobby(id),
      ]);
      const lobbyData = lobbyRes.data.data;
      setLobby(lobbyData);
      setLeaderboard(leaderboardRes.data.data);
      setSubmissions(submissionsRes.data.data);
      
      console.log('[ManageLobby] fetchData lobby.timePerProblem:', lobbyData.timePerProblem, 'skipTimer:', skipTimer);
      
      if (lobbyData.matchType === 'QUIZ_BEE') {
        if (skipTimer) {
          // Only update metadata — timer state is managed by socket events
          setQuizBeeControl(prev => ({
            ...prev,
            currentProblem: lobbyData.currentProblemIndex || 0,
            totalProblems: lobbyData.problems?.length || 0,
          }));
        } else {
          // Full initialization (initial page load / refresh)
          const isRevealed = !!lobbyData.problemStartTime;
          setQuizBeeControl(prev => ({
            ...prev,
            currentProblem: lobbyData.currentProblemIndex || 0,
            totalProblems: lobbyData.problems?.length || 0,
            problemRevealed: isRevealed,
            timeExpired: false
          }));
          
          if (isRevealed && lobbyData.timePerProblem && lobbyData.problemStartTime) {
            const elapsed = Math.floor((Date.now() - new Date(lobbyData.problemStartTime).getTime()) / 1000);
            const totalSec = lobbyData.timePerProblem * 60;
            // Clamp remaining to [0, totalSec] — prevents bug if problemStartTime is somehow in the future
            const remaining = Math.min(totalSec, Math.max(0, totalSec - elapsed));
            console.log('[ManageLobby] Timer calc: elapsed=', elapsed, 'totalSec=', totalSec, 'remaining=', remaining);
            if (remaining > 0) {
              startCountdown(remaining);
            } else {
              setProblemTimeLeft(0);
              setQuizBeeControl(prev => ({ ...prev, timeExpired: true, problemRevealed: false }));
            }
          } else {
            setProblemTimeLeft(lobbyData.timePerProblem ? lobbyData.timePerProblem * 60 : 0);
          }
        }
      }
    } catch (error) {
      toast.error('Failed to load lobby data');
      navigate('/teacher/lobbies');
    } finally {
      setLoading(false);
    }
  };

  // Lightweight refresh for leaderboard + submissions only (called on socket events)
  const fetchLeaderboardAndSubmissions = async () => {
    try {
      const [leaderboardRes, submissionsRes] = await Promise.all([
        lobbiesAPI.getLeaderboard(id),
        submissionsAPI.getByLobby(id),
      ]);
      setLeaderboard(leaderboardRes.data.data);
      setSubmissions(submissionsRes.data.data);
    } catch (error) {
      console.error('Failed to refresh leaderboard:', error);
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

  const handleStart = async () => {
    if (!window.confirm('Start the match? Participants will be notified.')) return;
    try {
      await lobbiesAPI.start(id);
      toast.success('Match started!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start match');
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
      // State will be updated by the problem-change socket event
      // No need to call fetchData here — the socket handler handles it
      toast.success('Advanced to next problem!');
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentProblem = () => {
    if (!lobby?.problems || !Array.isArray(lobby.problems)) return null;
    return lobby.problems[lobby.currentProblemIndex || 0];
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

      {/* Waiting Room — shown while lobby is in WAITING status */}
      {lobby?.status === 'WAITING' && (
        <div className="bg-arena-card border border-arena-border rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary-500/10 to-primary-600/10 border-b border-arena-border px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-primary-400" />
                Waiting Room
              </h2>
              <p className="text-sm text-gray-400 mt-1">Share the access code — start when everyone has joined</p>
            </div>
            <button
              onClick={handleStart}
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-base"
            >
              <Play className="h-5 w-5 mr-2" />
              Start Match
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Access code */}
            <div className="bg-arena-dark rounded-xl p-5 flex flex-col items-center justify-center border border-arena-border">
              <p className="text-sm text-gray-400 mb-2">Share this code with participants</p>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-mono font-bold tracking-widest text-primary-400">
                  {lobby.accessCode}
                </span>
                <button
                  onClick={copyAccessCode}
                  className="p-2 text-gray-400 hover:text-primary-400 transition-colors"
                  title="Copy access code"
                >
                  <Copy className="h-5 w-5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">{lobby.matchType === 'QUIZ_BEE' ? 'Quiz Bee' : 'Standard'} · {lobby.problems?.length || 0} problems · {lobby.duration} min</p>
            </div>

            {/* Participants list */}
            <div className="bg-arena-dark rounded-xl p-5 border border-arena-border">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-300">Participants</p>
                <span className="bg-primary-500/20 text-primary-400 text-xs font-bold px-2 py-0.5 rounded-full">
                  {lobby.participants?.length || 0} joined
                </span>
              </div>
              {!lobby.participants?.length ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Users className="h-8 w-8 text-gray-600 mb-2" />
                  <p className="text-gray-500 text-sm">No participants yet</p>
                  <p className="text-gray-600 text-xs mt-1">Waiting for students to join...</p>
                </div>
              ) : (
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {lobby.participants.map((p, idx) => (
                    <li key={p.user?._id || idx} className="flex items-center gap-2 text-sm">
                      <span className="w-6 h-6 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-white">{p.user?.username || 'Unknown'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

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
              <div className="text-sm text-gray-300 mt-1 truncate">
                {getCurrentProblem()?.title || 'No problem'}
              </div>
            </div>

            <div className="bg-arena-card rounded-lg p-4 border border-arena-border">
              <div className="text-sm text-gray-400 mb-1">Time Remaining</div>
              {quizBeeControl.problemRevealed ? (
                <>
                  <div className={`text-2xl font-bold ${
                    problemTimeLeft === 0 ? 'text-red-400' :
                    problemTimeLeft <= 60 ? 'text-yellow-400' :
                    'text-white'
                  }`}>
                    {formatTime(problemTimeLeft)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {problemTimeLeft === 0 ? 'Time expired!' : `of ${lobby.timePerProblem} min per problem`}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-gray-500">
                    {formatTime(lobby.timePerProblem * 60)}
                  </div>
                  <div className="text-xs text-yellow-400 mt-1">
                    ⏸️ Timer starts when revealed
                  </div>
                </>
              )}
            </div>

            <div className="bg-arena-card rounded-lg p-4 border border-arena-border">
              <div className="text-sm text-gray-400 mb-1">Status</div>
              <div className="text-lg font-semibold">
                {quizBeeControl.timeExpired ? (
                  <span className="text-red-400">⏰ Time Expired</span>
                ) : quizBeeControl.problemRevealed ? (
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

          {/* Current Problem Preview for Teacher */}
          {getCurrentProblem() && (
            <div className="mt-4 bg-arena-card rounded-lg border border-arena-border overflow-hidden">
              <div className="bg-arena-dark px-4 py-3 border-b border-arena-border flex items-center justify-between">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  📋 Current Problem Preview
                  <span className={`text-xs px-2 py-0.5 rounded ${getCurrentProblem().difficulty === 'easy' ? 'bg-green-500/20 text-green-400' : getCurrentProblem().difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                    {getCurrentProblem().difficulty}
                  </span>
                </h3>
              </div>
              <div className="p-6 max-h-[32rem] overflow-y-auto">
                <h4 className="text-xl font-bold text-white mb-4">{getCurrentProblem().title}</h4>

                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{getCurrentProblem().description}</p>

                  {getCurrentProblem().constraints && (
                    <div className="mt-4">
                      <h5 className="text-white font-semibold mb-2">Constraints:</h5>
                      <p className="text-gray-300 whitespace-pre-wrap text-sm">{getCurrentProblem().constraints}</p>
                    </div>
                  )}

                  {getCurrentProblem().inputFormat && (
                    <div className="mt-4">
                      <h5 className="text-white font-semibold mb-2">Input Format:</h5>
                      <p className="text-gray-300 whitespace-pre-wrap text-sm">{getCurrentProblem().inputFormat}</p>
                    </div>
                  )}

                  {getCurrentProblem().outputFormat && (
                    <div className="mt-4">
                      <h5 className="text-white font-semibold mb-2">Output Format:</h5>
                      <p className="text-gray-300 whitespace-pre-wrap text-sm">{getCurrentProblem().outputFormat}</p>
                    </div>
                  )}

                  {(getCurrentProblem().sampleInput || getCurrentProblem().sampleOutput) && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getCurrentProblem().sampleInput && (
                        <div>
                          <h5 className="text-white font-semibold mb-2">Sample Input:</h5>
                          <pre className="bg-arena-dark p-3 rounded-lg border border-arena-border text-sm text-green-400 overflow-x-auto">{getCurrentProblem().sampleInput}</pre>
                        </div>
                      )}
                      {getCurrentProblem().sampleOutput && (
                        <div>
                          <h5 className="text-white font-semibold mb-2">Sample Output:</h5>
                          <pre className="bg-arena-dark p-3 rounded-lg border border-arena-border text-sm text-green-400 overflow-x-auto">{getCurrentProblem().sampleOutput}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
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
