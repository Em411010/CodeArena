import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, GraduationCap, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const result = await register(
      formData.username,
      formData.email,
      formData.password,
      formData.role
    );

    if (result.success) {
      navigate('/dashboard');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="card bg-base-300 shadow-xl w-full max-w-md">
        <div className="card-body">
          <div className="text-center mb-4">
            <h2 className="card-title text-3xl font-bold justify-center">Create Account</h2>
            <p className="text-base-content/70 mt-2">Join CodeArena and start competing</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">I am a...</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'student' })}
                  className={`btn ${formData.role === 'student' ? 'btn-primary' : 'btn-ghost border-base-content/20'}`}
                >
                  <GraduationCap className="h-5 w-5" />
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'teacher' })}
                  className={`btn ${formData.role === 'teacher' ? 'btn-primary' : 'btn-ghost border-base-content/20'}`}
                >
                  <BookOpen className="h-5 w-5" />
                  Teacher
                </button>
              </div>
              {formData.role === 'teacher' && (
                <div className="alert alert-warning mt-3 py-2">
                  <span className="text-sm">Teacher accounts require admin approval.</span>
                </div>
              )}
            </div>

            <div className="form-control">
              <label className="label" htmlFor="username">
                <span className="label-text">Username</span>
              </label>
              <label className="input input-bordered flex items-center gap-2">
                <User className="h-4 w-4 opacity-70" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  minLength={3}
                  maxLength={30}
                  value={formData.username}
                  onChange={handleChange}
                  className="grow"
                  placeholder="johndoe"
                />
              </label>
            </div>

            <div className="form-control">
              <label className="label" htmlFor="email">
                <span className="label-text">Email Address</span>
              </label>
              <label className="input input-bordered flex items-center gap-2">
                <Mail className="h-4 w-4 opacity-70" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="grow"
                  placeholder="you@example.com"
                />
              </label>
            </div>

            <div className="form-control">
              <label className="label" htmlFor="password">
                <span className="label-text">Password</span>
              </label>
              <label className="input input-bordered flex items-center gap-2">
                <Lock className="h-4 w-4 opacity-70" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  className="grow"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn btn-ghost btn-xs btn-circle"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </label>
            </div>

            <div className="form-control">
              <label className="label" htmlFor="confirmPassword">
                <span className="label-text">Confirm Password</span>
              </label>
              <label className="input input-bordered flex items-center gap-2">
                <Lock className="h-4 w-4 opacity-70" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="grow"
                  placeholder="••••••••"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="divider">OR</div>

          <div className="space-y-3">
            <a
              href={`${API_URL}/auth/google`}
              className="btn btn-outline w-full gap-2"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </a>

            <a
              href={`${API_URL}/auth/facebook`}
              className="btn btn-outline w-full gap-2"
            >
              <svg className="h-5 w-5" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Sign up with Facebook
            </a>
          </div>

          <div className="divider"></div>

          <p className="text-center text-base-content/70">
            Already have an account?{' '}
            <Link to="/login" className="link link-primary font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
