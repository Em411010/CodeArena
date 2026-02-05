import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { lobbiesAPI, submissionsAPI } from '../../services/api';
import socketService from '../../services/socket';
import {
  Clock,
  Loader2,
  Play,
  ChevronLeft,
  ChevronRight,
  Trophy,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const languageMap = {
  c: 'c',
};

const defaultCode = {
  c: '#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <math.h>\n#include <ctype.h>\n\nint main() {\n    // Your code here\n    \n    return 0;\n}\n',
};

const MatchArena = () => {
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
  const [timeLeft, setTimeLeft] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [solvedProblems, setSolvedProblems] = useState(new Set());

  useEffect(() => {
    fetchLobby();
    
    const socket = socketService.connect();
    socketService.joinLobby(id);

    socketService.onMatchEnded(() => {
      toast.success('Match has ended!');
      navigate(`/my-matches`);
    });

    socketService.onLeaderboardUpdate((data) => {
      fetchLeaderboard();
    });

    return () => {
      socketService.leaveLobby(id);
      socketService.removeAllListeners();
    };
  }, [id, navigate]);

  useEffect(() => {
    if (lobby?.endTime) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const end = new Date(lobby.endTime).getTime();
        const diff = Math.max(0, Math.floor((end - now) / 1000));
        setTimeLeft(diff);

        if (diff === 0) {
          clearInterval(interval);
          toast.success('Time is up!');
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [lobby?.endTime]);

  const fetchLobby = async () => {
    try {
      const { data } = await lobbiesAPI.getById(id);
      
      if (data.data.status === 'WAITING') {
        navigate(`/lobby/${id}`);
        return;
      }
      
      if (data.data.status === 'FINISHED') {
        toast.error('This match has ended');
        navigate('/my-matches');
        return;
      }

      setLobby(data.data);
      setProblems(data.data.problems || []);
      
      if (data.data.problems?.length > 0) {
        const firstProblem = data.data.problems[0];
        const firstLang = firstProblem.allowedLanguages?.[0] || 'c';
        setLanguage(firstLang);
        setCode(defaultCode[firstLang] || defaultCode.c);
      }

      fetchLeaderboard();
    } catch (error) {
      toast.error('Failed to load match');
      navigate('/join');
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

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProblemChange = (index) => {
    setCurrentProblemIndex(index);
    const problem = problems[index];
    const lang = problem.allowedLanguages?.[0] || 'c';
    setLanguage(lang);
    setCode(defaultCode[lang] || defaultCode.c);
    setResult(null);
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

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col -m-4 sm:-m-6 lg:-m-8">
      {/* Top Bar */}
      <div className="bg-arena-dark border-b border-arena-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-bold text-white">{lobby?.name}</h1>
          <div className="flex items-center space-x-2">
            {problems.map((p, idx) => (
              <button
                key={p._id}
                onClick={() => handleProblemChange(idx)}
                className={`w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center transition-colors ${
                  idx === currentProblemIndex
                    ? 'bg-primary-600 text-white'
                    : solvedProblems.has(p._id)
                    ? 'bg-green-600 text-white'
                    : 'bg-arena-card text-gray-400 hover:bg-arena-border'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-arena-card rounded-lg text-gray-300 hover:text-white transition-colors"
          >
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Leaderboard</span>
          </button>
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg ${
            timeLeft < 300 ? 'bg-red-500/20 text-red-400' : 'bg-arena-card text-white'
          }`}>
            <Clock className="h-4 w-4" />
            <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Problem & Editor */}
        <div className={`flex-1 flex flex-col lg:flex-row min-h-0 ${showLeaderboard ? 'lg:mr-80' : ''}`}>
          {/* Problem Description */}
          <div className="lg:w-1/2 bg-arena-dark border-r border-arena-border overflow-y-auto p-4">
            {currentProblem && (
              <div className="prose prose-invert max-w-none">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white m-0">
                    Problem {currentProblemIndex + 1}: {currentProblem.title}
                  </h2>
                  <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                    currentProblem.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                    currentProblem.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {currentProblem.difficulty} • {currentProblem.maxScore} pts
                  </span>
                </div>

                <p className="text-gray-300 whitespace-pre-wrap">{currentProblem.description}</p>

                {currentProblem.constraints && (
                  <>
                    <h3 className="text-white text-lg font-medium mt-6 mb-2">Constraints</h3>
                    <p className="text-gray-300 whitespace-pre-wrap">{currentProblem.constraints}</p>
                  </>
                )}

                {currentProblem.sampleInput && (
                  <>
                    <h3 className="text-white text-lg font-medium mt-6 mb-2">Sample Input</h3>
                    <pre className="bg-arena-card p-3 rounded-lg text-gray-300">{currentProblem.sampleInput}</pre>
                  </>
                )}

                {currentProblem.sampleOutput && (
                  <>
                    <h3 className="text-white text-lg font-medium mt-6 mb-2">Sample Output</h3>
                    <pre className="bg-arena-card p-3 rounded-lg text-gray-300">{currentProblem.sampleOutput}</pre>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Editor */}
          <div className="lg:w-1/2 flex flex-col min-h-0">
            {/* Editor Toolbar */}
            <div className="bg-arena-dark border-b border-arena-border px-4 py-2 flex items-center justify-between">
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  setCode(defaultCode[e.target.value] || '');
                }}
                className="bg-arena-card border border-arena-border rounded px-2 py-1 text-white text-sm"
              >
                {currentProblem?.allowedLanguages?.map((lang) => (
                  <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                ))}
              </select>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center px-4 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                {submitting ? <Loader2 className="animate-spin h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                Submit
              </button>
            </div>

            {/* Code Editor */}
            <div className="flex-1 min-h-[300px]">
              <Editor
                height="100%"
                language={languageMap[language]}
                value={code}
                onChange={setCode}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: 'JetBrains Mono, monospace',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>

            {/* Result */}
            {result && (
              <div className="bg-arena-dark border-t border-arena-border p-3">
                <div className="flex items-center space-x-3">
                  {result.verdict === 'ACCEPTED' ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400" />
                  )}
                  <span className={result.verdict === 'ACCEPTED' ? 'text-green-400' : 'text-red-400'}>
                    {result.verdict.replace('_', ' ')}
                  </span>
                  <span className="text-gray-400 text-sm">
                    ({result.testCasesPassed}/{result.totalTestCases} passed)
                  </span>
                  {result.score > 0 && (
                    <span className="text-yellow-400 text-sm">+{result.score} pts</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard Sidebar */}
        {showLeaderboard && (
          <div className="fixed right-0 top-0 h-full w-80 bg-arena-dark border-l border-arena-border overflow-y-auto z-40 pt-16">
            <div className="p-4">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <Trophy className="h-5 w-5 text-yellow-400 mr-2" />
                Leaderboard
              </h3>
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

export default MatchArena;
