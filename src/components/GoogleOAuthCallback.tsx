import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const GoogleOAuthCallback: React.FC = () => {
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const userParam = urlParams.get('user');
      const error = urlParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        // Redirect back to main app with error
        window.location.href = '/?auth_error=' + encodeURIComponent(error);
        return;
      }

      if (token && userParam) {
        try {
          // Parse user data from URL parameter
          const userData = JSON.parse(decodeURIComponent(userParam));
          
          // Login with the token and user data
          login(userData, token);
          
          // Clean URL and redirect back to main app
          window.history.replaceState({}, document.title, '/');
          window.location.href = '/';
        } catch (error) {
          console.error('Error parsing OAuth callback data:', error);
          window.location.href = '/?auth_error=callback_parse_error';
        }
      } else {
        // No token or user data, redirect with error
        window.location.href = '/?auth_error=missing_callback_data';
      }
    };

    handleCallback();
  }, [login]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
};
