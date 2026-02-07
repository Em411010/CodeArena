import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lobbiesAPI } from '../../services/api';
import socketService from '../../services/socket';
import { Users, Clock, Loader2, Timer } from 'lucide-react';
import toast from 'react-hot-toast';

const LobbyWaiting = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lobby, setLobby] = useState(null);
  const [loading, setLoading] = useState(true);
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    fetchLobby();
    
    // Connect to socket
    const socket = socketService.connect();
    socketService.joinLobby(id);

    // Listen for events
    socketService.onMatchStarted((data) => {
      toast.success('Match has started!');
      const matchPath = data.matchType === 'QUIZ_BEE' ? `/quiz-bee/${id}` : `/match/${id}`;
      navigate(matchPath);
    });

    socketService.onParticipantJoined((data) => {
      setParticipantCount(data.participantCount);
    });

    return () => {
      socketService.leaveLobby(id);
      socketService.removeAllListeners();
    };
  }, [id, navigate]);

  const fetchLobby = async () => {
    try {
      const { data } = await lobbiesAPI.getById(id);
      setLobby(data.data);
      setParticipantCount(data.data.participants?.length || 0);
      
      // If match already started, redirect to appropriate arena
      if (data.data.status === 'ONGOING') {
        const matchPath = data.data.matchType === 'QUIZ_BEE' ? `/quiz-bee/${id}` : `/match/${id}`;
        navigate(matchPath);
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
          <div className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Timer className="h-10 w-10 text-primary-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          {lobby?.name}
        </h1>
        <p className="text-gray-400 mb-6">
          Waiting for the match to start...
        </p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-arena-dark rounded-lg p-4">
            <Users className="h-6 w-6 text-primary-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{participantCount}</p>
            <p className="text-gray-400 text-sm">Participants</p>
          </div>
          <div className="bg-arena-dark rounded-lg p-4">
            <Clock className="h-6 w-6 text-primary-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{lobby?.duration}</p>
            <p className="text-gray-400 text-sm">Minutes</p>
          </div>
        </div>

        <div className="text-gray-400 text-sm">
          <p>Hosted by <span className="text-white">{lobby?.teacher?.username}</span></p>
        </div>

        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-500 text-sm">
            🔒 Problems will be revealed when the match starts
          </p>
        </div>
      </div>
    </div>
  );
};

export default LobbyWaiting;
