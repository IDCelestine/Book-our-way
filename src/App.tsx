import { useState, useEffect } from 'react';
import { getSupabaseClient } from './utils/supabase/client.tsx';
import { AuthPage } from './components/AuthPage';
import { HomePage } from './components/HomePage';
import { DashboardPage } from './components/DashboardPage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const supabase = getSupabaseClient();

      const { data: { session }, error } = await supabase.auth.getSession();

      if (session?.access_token && session?.user?.id) {
        setAccessToken(session.access_token);
        setUserId(session.user.id);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (token: string, id: string) => {
    setAccessToken(token);
    setUserId(id);
    setIsAuthenticated(true);
    setShowAuth(false);
  };

  const handleLogout = () => {
    setAccessToken(null);
    setUserId(null);
    setIsAuthenticated(false);
    setShowAuth(false);
  };

  const handleLoginClick = () => {
    setShowAuth(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (showAuth) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  if (isAuthenticated && accessToken && userId) {
    return (
      <DashboardPage
        accessToken={accessToken}
        userId={userId}
        onLogout={handleLogout}
      />
    );
  }

  return <HomePage onLoginClick={handleLoginClick} />;
}