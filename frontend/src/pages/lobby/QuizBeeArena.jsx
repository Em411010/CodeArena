import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { lobbiesAPI, submissionsAPI } from '../../services/api';
import socketService from '../../services/socket';
import {
  Clock,
  Loader2,
  Play,
  Trophy,
  CheckCircle,
  XCircle,
  X,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

const languageMap = {
  c: 'c',
};

const defaultCode = {
  c: '#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <math.h>\n#include <ctype.h>\n\nint main() {\n    // Your code here\n    \n    return 0;\n}\n',
};

const QuizBeeArena = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lobby, setLobby] = useState(null);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [language, setLanguage] = useState('c');
  const [code, setCode] = useState(defaultCode.c);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [problemTimeLeft, setProblemTimeLeft] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [solvedProblems, setSolvedProblems] = useState(new Set());
  const [problemRevealed, setProblemRevealed] = useState(false);
  const [waitingForHost, setWaitingForHost] = useState(true);
  const [timeExpired, setTimeExpired] = useState(false);
  const timerRef = useRef(null);

  const startCountdown = (seconds) => {
    if (timerRef.current) clearInterval(timerRef.current);
    let remaining = seconds;
    setProblemTimeLeft(remaining);
    setTimeExpired(false);

    timerRef.current = setInterval(() => {
      remaining -= 1;
      setProblemTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setProblemTimeLeft(0);
        setTimeExpired(true);
        setProblemRevealed(false);
        setWaitingForHost(true);
        toast('⏰ Time is up! Waiting for host...', { icon: '⏰' });
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
    fetchLobby();
    
    const socket = socketService.connect();
    socketService.joinLobby(id);

    socketService.onMatchEnded((data) => {
      const reason = data?.reason || 'Match has ended';
      toast.success(reason);
      stopCountdown();
      setTimeout(() => {
        navigate(`/match/${id}/leaderboard`);
      }, 2000);
    });

    socketService.onLeaderboardUpdate(() => {
      fetchLeaderboard();
    });

    // Host advanced to next problem
    socket.on('problem-change', (data) => {
      if (data.lobbyId === id) {
        stopCountdown();
        setCurrentProblemIndex(data.currentProblemIndex);
        setResult(null);
        setProblemRevealed(false);
        setWaitingForHost(true);
        setTimeExpired(false);
        setProblemTimeLeft(0);
        toast.info(`Host moved to Problem ${data.currentProblemIndex + 1}/${data.totalProblems}`);
        setCode(defaultCode[language]);
        // Use skipTimer=true so fetchLobby doesn't override socket-managed timer state
        fetchLobby(true);
      }
    });

    // Host revealed the problem — start countdown
    socket.on('problem-revealed', (data) => {
      if (data.lobbyId === id) {
        setProblemRevealed(true);
        setWaitingForHost(false);
        setTimeExpired(false);
        toast.success('Problem revealed! Start solving! 🚀');
        if (data.timePerProblem) {
          startCountdown(data.timePerProblem * 60);
        }
        // Use skipTimer=true so fetchLobby doesn't restart/override the countdown
        fetchLobby(true);
      }
    });

    // Server says time is up
    socket.on('problem-time-expired', (data) => {
      if (data.lobbyId === id) {
        stopCountdown();
        setProblemTimeLeft(0);
        setTimeExpired(true);
        setProblemRevealed(false);
        setWaitingForHost(true);
        toast('⏰ Time is up! Waiting for host...', { icon: '⏰' });
      }
    });

    return () => {
      stopCountdown();
      socketService.leaveLobby(id);
      socket.off('problem-change');
      socket.off('problem-revealed');
      socket.off('problem-time-expired');
      socketService.removeAllListeners();
    };
  }, [id, navigate, language]);

  // skipTimer: when true, only refresh lobby/problem data without touching timer/reveal state
  // This prevents race conditions when called from socket handlers
  const fetchLobby = async (skipTimer = false) => {
    try {
      const { data } = await lobbiesAPI.getById(id);
      
      // Redirect to standard arena if this is NOT a Quiz Bee match
      if (data.data.matchType !== 'QUIZ_BEE') {
        navigate(`/match/${id}`, { replace: true });
        return;
      }
      
      setLobby(data.data);
      
      // Problems are already populated by the backend
      if (data.data.problems) {
        setProblems(data.data.problems);
      }
      setCurrentProblemIndex(data.data.currentProblemIndex || 0);
      
      if (!skipTimer) {
        // Full timer initialization (initial page load / refresh only)
        if (data.data.problemStartTime) {
          const elapsed = Math.floor((Date.now() - new Date(data.data.problemStartTime).getTime()) / 1000);
          const totalSec = (data.data.timePerProblem || 5) * 60;
          // Clamp remaining to [0, totalSec] — prevents bug if problemStartTime is somehow in the future
          const remaining = Math.min(totalSec, Math.max(0, totalSec - elapsed));
          console.log('[QuizBeeArena] Timer calc: elapsed=', elapsed, 'totalSec=', totalSec, 'remaining=', remaining);
          
          if (remaining > 0) {
            setProblemRevealed(true);
            setWaitingForHost(false);
            setTimeExpired(false);
            startCountdown(remaining);
          } else {
            // Time already expired
            setProblemRevealed(false);
            setWaitingForHost(true);
            setTimeExpired(true);
            setProblemTimeLeft(0);
          }
        } else {
          setProblemRevealed(false);
          setWaitingForHost(true);
          setTimeExpired(false);
          setProblemTimeLeft(0);
        }
      }
      // When skipTimer=true, timer/reveal state is managed by socket events — don't touch it
      
      fetchLeaderboard();
    } catch (error) {
      console.error('Fetch lobby error:', error);
      toast.error('Failed to load match');
      navigate('/my-matches');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const { data } = await lobbiesAPI.getLeaderboard(id);
      setLeaderboard(data.data);
    } catch (error) {
      console.error('Failed to fetch leaderboard');
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first');
      return;
    }

    const currentProblem = problems[currentProblemIndex];
    setSubmitting(true);
    setResult(null);

    try {
      const { data } = await submissionsAPI.submit({
        problemId: currentProblem._id,
        problemType: 'CompetitionProblem',
        lobbyId: id,
        language,
        code,
      });

      setResult(data.data);

      if (data.data.verdict === 'ACCEPTED') {
        toast.success('Accepted! 🎉');
        setSolvedProblems(prev => new Set([...prev, currentProblem._id]));
        fetchLeaderboard();
      } else {
        toast.error(`Verdict: ${data.data.verdict.replace('_', ' ')}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const currentProblem = problems[currentProblemIndex];
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col -m-4 sm:-m-6 lg:-m-8">
      <div className="bg-arena-dark border-b border-arena-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-bold text-white">{lobby?.name}</h1>
          <div className="flex items-center space-x-2 bg-yellow-500/20 px-3 py-1 rounded-lg border border-yellow-500/50">
            <span className="text-yellow-400 text-sm font-semibold">Quiz Bee Mode</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-primary-500/20 px-3 py-1.5 rounded-lg border border-primary-500/50">
            <Clock className="h-4 w-4 text-primary-400" />
            <span className="text-white font-mono font-medium">
              {formatTime(problemTimeLeft)}
            </span>
          </div>
          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg transition-colors"
          >
            <Trophy className="h-4 w-4 text-yellow-400" />
            <span className="hidden sm:inline text-white">Leaderboard</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className={`flex-1 flex flex-col lg:flex-row min-h-0 ${showLeaderboard ? 'lg:mr-80' : ''}`}>
          {/* Waiting for Host Overlay */}
          {waitingForHost && !problemRevealed && (
            <div className="absolute inset-0 bg-arena-bg/95 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="text-center max-w-md px-6">
                <div className="mb-6">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                    timeExpired ? 'bg-red-500/20' : 'bg-yellow-500/20'
                  }`}>
                    <Clock className={`h-10 w-10 ${timeExpired ? 'text-red-400' : 'text-yellow-400 animate-pulse'}`} />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">
                  {timeExpired ? '⏰ Time\'s Up!' : 'Waiting for Host'}
                </h2>
                <p className="text-lg text-gray-300 mb-2">
                  {timeExpired
                    ? 'Submissions for this problem are closed'
                    : `The host will reveal Problem ${currentProblemIndex + 1} when ready`
                  }
                </p>
                <p className="text-sm text-gray-400">
                  {timeExpired
                    ? 'Please wait for the host to move to the next problem'
                    : 'In Quiz Bee mode, the host controls when each problem is shown'
                  }
                </p>
                <div className="mt-8 flex items-center justify-center space-x-2">
                  <div className={`w-3 h-3 rounded-full animate-bounce ${timeExpired ? 'bg-red-400' : 'bg-yellow-400'}`} style={{animationDelay: '0ms'}}></div>
                  <div className={`w-3 h-3 rounded-full animate-bounce ${timeExpired ? 'bg-red-400' : 'bg-yellow-400'}`} style={{animationDelay: '150ms'}}></div>
                  <div className={`w-3 h-3 rounded-full animate-bounce ${timeExpired ? 'bg-red-400' : 'bg-yellow-400'}`} style={{animationDelay: '300ms'}}></div>
                </div>
              </div>
            </div>
          )}

          <div className="w-full lg:w-1/2 flex flex-col border-r border-arena-border overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-bold text-white">
                    Problem {currentProblemIndex + 1} / {problems.length}
                  </h2>
                  {solvedProblems.has(currentProblem?._id) && (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  )}
                </div>
                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  currentProblem?.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                  currentProblem?.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {currentProblem?.difficulty}
                </span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-4">{currentProblem?.title}</h3>

              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 whitespace-pre-wrap">{currentProblem?.description}</p>

                {currentProblem?.constraints && (
                  <>
                    <h4 className="text-white font-semibold mt-4 mb-2">Constraints:</h4>
                    <p className="text-gray-300 whitespace-pre-wrap">{currentProblem.constraints}</p>
                  </>
                )}

                {currentProblem?.inputFormat && (
                  <>
                    <h4 className="text-white font-semibold mt-4 mb-2">Input Format:</h4>
                    <p className="text-gray-300 whitespace-pre-wrap">{currentProblem.inputFormat}</p>
                  </>
                )}

                {currentProblem?.outputFormat && (
                  <>
                    <h4 className="text-white font-semibold mt-4 mb-2">Output Format:</h4>
                    <p className="text-gray-300 whitespace-pre-wrap">{currentProblem.outputFormat}</p>
                  </>
                )}

                {currentProblem?.sampleInput && (
                  <>
                    <h4 className="text-white font-semibold mt-4 mb-2">Sample Input:</h4>
                    <pre className="bg-arena-dark p-3 rounded-lg border border-arena-border text-gray-300 overflow-x-auto">
                      {currentProblem.sampleInput}
                    </pre>
                  </>
                )}

                {currentProblem?.sampleOutput && (
                  <>
                    <h4 className="text-white font-semibold mt-4 mb-2">Sample Output:</h4>
                    <pre className="bg-arena-dark p-3 rounded-lg border border-arena-border text-gray-300 overflow-x-auto">
                      {currentProblem.sampleOutput}
                    </pre>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2 flex flex-col min-h-0">
            <div className="bg-arena-card border-b border-arena-border px-4 py-2 flex items-center justify-between">
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  setCode(defaultCode[e.target.value]);
                }}
                className="px-3 py-1.5 bg-arena-dark border border-arena-border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="c">C</option>
              </select>
              <button
                onClick={handleSubmit}
                disabled={submitting || waitingForHost || !problemRevealed || timeExpired}
                className="px-4 py-1.5 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : waitingForHost || !problemRevealed ? (
                  <>
                    <Clock className="h-4 w-4" />
                    <span>Waiting...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    <span>Submit</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex-1 min-h-0">
              <Editor
                height="100%"
                language={languageMap[language]}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>

            {result && (
              <div className={`border-t border-arena-border p-4 ${
                result.verdict === 'ACCEPTED' ? 'bg-green-500/10' : 'bg-red-500/10'
              }`}>
                <div className="flex items-start space-x-3">
                  {result.verdict === 'ACCEPTED' ? (
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${
                      result.verdict === 'ACCEPTED' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {result.verdict.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-300 mt-1">
                      Test Cases: {result.testCasesPassed}/{result.totalTestCases} passed
                    </p>
                    {result.score > 0 && (
                      <p className="text-sm text-gray-300">
                        Score: +{result.score} points
                      </p>
                    )}
                    {result.errorMessage && (
                      <p className="text-sm text-red-400 mt-2">{result.errorMessage}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {showLeaderboard && (
          <div className="fixed right-0 top-0 h-full w-80 bg-arena-dark border-l border-arena-border overflow-y-auto z-40 pt-16">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <Trophy className="h-5 w-5 text-yellow-400 mr-2" />
                  Leaderboard
                </h3>
                <button
                  onClick={() => setShowLeaderboard(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Close leaderboard"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-2">
                {leaderboard.map((entry, idx) => (
                  <div
                    key={entry.user._id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      idx === 0 ? 'bg-yellow-500/20' :
                      idx === 1 ? 'bg-gray-400/20' :
                      idx === 2 ? 'bg-orange-500/20' :
                      'bg-arena-card'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-yellow-500 text-black' :
                        idx === 1 ? 'bg-gray-400 text-black' :
                        idx === 2 ? 'bg-orange-500 text-black' :
                        'bg-arena-border text-white'
                      }`}>
                        {entry.rank}
                      </span>
                      <span className="text-white font-medium">{entry.user.username}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{entry.score}</p>
                      <p className="text-gray-400 text-xs">{entry.solvedCount} solved</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizBeeArena;
