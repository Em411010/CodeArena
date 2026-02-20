import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lobbiesAPI } from '../../services/api';
import socketService from '../../services/socket';
import { Users, Clock, Loader2, Timer, Play } from 'lucide-react';
import toast from 'react-hot-toast';

const LobbyWaiting = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lobby, setLobby] = useState(null);
  const [loading, setLoading] = useState(true);
  const [participantCount, setParticipantCount] = useState(0);
  const [matchStarted, setMatchStarted] = useState(false);
  const [isQuizBee, setIsQuizBee] = useState(false);

  useEffect(() => {
    fetchLobby();
    
    // Connect to socket
    const socket = socketService.connect();
    socketService.joinLobby(id);

    // Listen for match started event
    socketService.onMatchStarted((data) => {
      toast.success('Match has started!');
      
      // For Standard matches, go directly to arena
      if (data.matchType !== 'QUIZ_BEE') {
        navigate(`/match/${id}`);
      } else {
        // For Quiz Bee, stay in lobby and wait for host to reveal first problem
        setMatchStarted(true);
        setIsQuizBee(true);
      }
    });

    // Listen for problem revealed (Quiz Bee only) - this triggers arena entry
    socket.on('problem-revealed', (data) => {
      if (data.lobbyId === id) {
        toast.success('First problem revealed! Entering arena... 🚀');
        navigate(`/quiz-bee/${id}`);
      }
    });

    socketService.onParticipantJoined((data) => {
      setParticipantCount(data.participantCount);
    });

    return () => {
      socketService.leaveLobby(id);
      socket.off('problem-revealed');
      socketService.removeAllListeners();
    };
  }, [id, navigate]);

  const fetchLobby = async () => {
    try {
      const { data } = await lobbiesAPI.getById(id);
      setLobby(data.data);
      setParticipantCount(data.data.participants?.length || 0);
      setIsQuizBee(data.data.matchType === 'QUIZ_BEE');
      
      // If match already started
      if (data.data.status === 'ONGOING') {
        // For Quiz Bee, check if problem has been revealed
        if (data.data.matchType === 'QUIZ_BEE') {
          if (data.data.problemStartTime) {
            // Problem already revealed, go to arena
            navigate(`/quiz-bee/${id}`);
          } else {
            // Match started but problem not revealed yet, stay and wait
            setMatchStarted(true);
          }
        } else {
          // Standard match, go directly to arena
          navigate(`/match/${id}`);
        }
      } else if (data.data.status === 'FINISHED') {
        toast.error('This match has already ended');
        navigate('/my-matches');
      }
    } catch (error) {
      toast.error('Failed to load lobby');
      navigate('/join');
    } finally {
      setLoading(false);
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
    <div className="max-w-2xl mx-auto">
      <div className="bg-arena-card border border-arena-border rounded-xl p-8 text-center">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-arena-border"></div>
          <div className={`absolute inset-0 rounded-full border-4 ${matchStarted ? 'border-yellow-500' : 'border-primary-500'} border-t-transparent animate-spin`}></div>
          <div className="absolute inset-0 flex items-center justify-center">
            {matchStarted ? (
              <Play className="h-10 w-10 text-yellow-400" />
            ) : (
              <Timer className="h-10 w-10 text-primary-500" />
            )}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          {lobby?.name}
        </h1>
        
        {matchStarted && isQuizBee ? (
          <>
            <div className="mb-4 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg inline-block">
              <p className="text-green-400 font-semibold">✓ Match has started!</p>
            </div>
            <p className="text-gray-400 mb-6">
              Waiting for host to reveal the first problem...
            </p>
          </>
        ) : (
          <p className="text-gray-400 mb-6">
            Waiting for the match to start...
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-arena-dark rounded-lg p-4">
            <Users className="h-6 w-6 text-primary-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{participantCount}</p>
            <p className="text-gray-400 text-sm">Participants</p>
          </div>
          <div className="bg-arena-dark rounded-lg p-4">
            <Clock className="h-6 w-6 text-primary-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">
              {isQuizBee ? lobby?.timePerProblem : lobby?.duration}
            </p>
            <p className="text-gray-400 text-sm">
              {isQuizBee ? 'Min/Problem' : 'Minutes'}
            </p>
          </div>
        </div>

        <div className="text-gray-400 text-sm">
          <p>Hosted by <span className="text-white">{lobby?.teacher?.username}</span></p>
        </div>

        {isQuizBee ? (
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-500 text-sm font-medium mb-1">🎯 Quiz Bee Mode</p>
            <p className="text-yellow-500/80 text-sm">
              {matchStarted 
                ? 'Get ready! The host will reveal each problem one at a time.'
                : 'Problems will be revealed one at a time by the host.'
              }
            </p>
          </div>
        ) : (
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-500 text-sm">
              🔒 Problems will be revealed when the match starts
            </p>
          </div>
        )}

        {matchStarted && isQuizBee && (
          <div className="mt-4 flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LobbyWaiting;
