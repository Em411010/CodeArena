import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lobbiesAPI } from '../../services/api';
import { DoorOpen, Loader2, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

const JoinLobby = () => {
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!accessCode.trim()) {
      toast.error('Please enter an access code');
      return;
    }

    setLoading(true);

    try {
      const { data } = await lobbiesAPI.join(accessCode);
      toast.success(data.message);
      
      // Navigate based on lobby status and match type
      if (data.data.status === 'ONGOING') {
        const matchPath = data.data.matchType === 'QUIZ_BEE' 
          ? `/quiz-bee/${data.data._id}` 
          : `/match/${data.data._id}`;
        navigate(matchPath);
      } else {
        navigate(`/lobby/${data.data._id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join lobby');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    // Convert to uppercase and remove non-alphanumeric characters
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setAccessCode(value);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <DoorOpen className="h-8 w-8 text-primary-500" />
        </div>
        <h1 className="text-2xl font-bold text-white">Join a Match</h1>
        <p className="text-gray-400 mt-2">
          Enter the access code provided by your teacher to join a competition
        </p>
      </div>

      <div className="bg-arena-card border border-arena-border rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="accessCode" className="block text-sm font-medium text-gray-300 mb-2">
              Access Code
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-gray-500" />
              </div>
              <input
                id="accessCode"
                type="text"
                value={accessCode}
                onChange={handleCodeChange}
                maxLength={6}
                placeholder="XXXXXX"
                className="block w-full pl-10 pr-4 py-4 bg-arena-dark border border-arena-border rounded-lg text-white text-center text-2xl tracking-widest font-mono placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500 text-center">
              The code is usually 6 characters
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || accessCode.length < 6}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Joining...
              </>
            ) : (
              <>
                <DoorOpen className="h-5 w-5 mr-2" />
                Join Match
              </>
            )}
          </button>
        </form>
      </div>

      <div className="mt-6 text-center">
        <p className="text-gray-500 text-sm">
          Don't have an access code? Ask your teacher for the match code.
        </p>
      </div>
    </div>
  );
};

export default JoinLobby;
