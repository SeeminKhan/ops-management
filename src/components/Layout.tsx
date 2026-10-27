import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Home, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleSignOut() {
    try {
      await signOut();
      navigate('/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  const isManager = profile?.role === 'operations_manager';
  const isStaff = profile?.role === 'outlet_staff';

  const navLinks = isManager
    ? [
        { path: '/', label: 'Dashboard', icon: Home },
      ]
    : [];

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="bg-white border-b border-benne-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo + brand */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 bg-benne-gold rounded-full flex items-center justify-center cursor-pointer hover:bg-benne-gold-dark transition-colors"
                onClick={() => navigate('/')}
              >
                <span className="text-white text-lg font-serif">B</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-xl font-serif text-benne-brown leading-none">Benne Ops</p>
                <p className="text-xs text-benne-brown-muted mt-0.5">
                  {isManager && 'Operations Manager'}
                  {isStaff && 'Outlet Staff'}
                </p>
              </div>
            </div>

            {/* Desktop nav (manager only) */}
            {isManager && (
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map(({ path, label, icon: Icon }) => (
                  <button
                    key={path}
                    onClick={() => navigate(path)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === path
                        ? 'text-benne-gold bg-benne-gold/10'
                        : 'text-benne-brown-muted hover:text-benne-brown hover:bg-benne-cream'
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </nav>
            )}

            {/* Right side: name + notifications + sign out */}
            <div className="flex items-center gap-2">
              {/* User name — hidden on mobile */}
              <div className="text-right hidden sm:block mr-1">
                <p className="text-sm font-medium text-benne-brown leading-none">{profile?.full_name}</p>
                <p className="text-xs text-benne-brown-muted mt-0.5">
                  {profile?.role === 'operations_manager' ? 'Manager' : 'Staff'}
                </p>
              </div>

              {/* Notification bell */}
              <NotificationBell />

              {/* Sign out */}
              <button
                onClick={handleSignOut}
                className="p-2 text-benne-brown-muted hover:text-benne-brown hover:bg-benne-cream rounded-md transition-colors"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>

              {/* Mobile menu toggle (manager only) */}
              {isManager && (
                <button
                  className="md:hidden p-2 text-benne-brown-muted hover:text-benne-brown hover:bg-benne-cream rounded-md transition-colors"
                  onClick={() => setMobileMenuOpen((v) => !v)}
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Mobile nav drawer ──────────────────────────────────── */}
        {isManager && mobileMenuOpen && (
          <div className="md:hidden border-t border-benne-border bg-white px-4 py-2 space-y-1">
            {/* User identity on mobile */}
            <div className="flex items-center gap-3 py-3 border-b border-benne-border mb-2">
              <div className="w-9 h-9 rounded-full bg-benne-gold/20 flex items-center justify-center">
                <span className="text-benne-gold font-serif font-semibold text-sm">
                  {profile?.full_name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-benne-brown">{profile?.full_name}</p>
                <p className="text-xs text-benne-brown-muted">Operations Manager</p>
              </div>
            </div>

            {navLinks.map(({ path, label, icon: Icon }) => (
              <button
                key={path}
                onClick={() => { navigate(path); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === path
                    ? 'text-benne-gold bg-benne-gold/10'
                    : 'text-benne-brown-muted hover:text-benne-brown hover:bg-benne-cream'
                }`}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── Main Content ──────────────────────────────────────────── */}
      <main className="flex-1 bg-benne-cream">
        {children}
      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-benne-border py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-benne-brown-muted text-center">
            Independent concept · Not affiliated with Benne
          </p>
        </div>
      </footer>
    </div>
  );
}
