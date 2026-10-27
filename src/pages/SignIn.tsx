import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserCheck, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Demo credentials
const DEMO_CREDENTIALS = {
  manager: {
    email: 'manager@benne.demo',
    password: 'Manager2024!',
    label: 'Operations Manager',
  },
  staff: {
    email: 'staff.juhu@benne.demo',
    password: 'Staff2024!',
    label: 'Outlet Staff (Juhu)',
  },
};

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickLogin(credentials: { email: string; password: string }) {
    setError('');
    setLoading(true);
    try {
      await signIn(credentials.email, credentials.password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 bg-benne-gold rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-white text-2xl font-serif">B</span>
            </div>
          </div>
          <h1 className="text-4xl font-serif text-benne-brown mb-2">Benne Ops</h1>
          <p className="text-benne-brown-muted text-sm">
            Multi-outlet operations management
          </p>
        </div>

        {/* Sign In Form */}
        <div className="card mb-5">
          <h2 className="text-2xl font-serif text-benne-brown mb-6">Sign In</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-benne-brown mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="your.email@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-benne-brown mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-benne-brown-muted hover:text-benne-brown"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Quick Login Buttons */}
        <div className="space-y-3 mb-6">
          <p className="text-xs font-semibold text-benne-brown-muted uppercase tracking-wider text-center mb-3">
            Try Demo Accounts
          </p>
          <div className="grid grid-cols-2 gap-3">
            {/* Manager Button */}
            <button
              onClick={() => handleQuickLogin(DEMO_CREDENTIALS.manager)}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 text-blue-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserCheck size={18} />
              <span className="text-sm">Manager</span>
            </button>

            {/* Outlet Staff Button */}
            <button
              onClick={() => handleQuickLogin(DEMO_CREDENTIALS.staff)}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 text-purple-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Users size={18} />
              <span className="text-sm">Outlet Staff</span>
            </button>
          </div>
          <p className="text-xs text-benne-brown-muted text-center">
            Click to auto-fill demo credentials
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-benne-brown-muted mt-6">
          Independent concept · Not affiliated with Benne
        </p>
      </div>
    </div>
  );
}
