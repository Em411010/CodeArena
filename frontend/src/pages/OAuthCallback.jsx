import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const token = searchParams.get('token');
      const provider = searchParams.get('provider');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError(`Authentication failed with ${provider || 'provider'}`);
        toast.error('OAuth authentication failed');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      if (!token) {
        setError('No authentication token received');
        toast.error('Authentication failed');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      try {
        await loginWithToken(token);
        toast.success(`Logged in with ${provider || 'OAuth'}!`);
        navigate('/dashboard');
      } catch (err) {
        setError('Failed to complete authentication');
        toast.error('Authentication failed');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, loginWithToken]);

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="card bg-base-300 shadow-xl p-8 text-center">
        {error ? (
          <>
            <div className="text-error text-xl mb-4">⚠️</div>
            <h2 className="text-lg font-semibold text-error">{error}</h2>
            <p className="text-base-content/70 mt-2">Redirecting to login...</p>
          </>
        ) : (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-lg font-semibold">Completing authentication...</h2>
            <p className="text-base-content/70 mt-2">Please wait</p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;
