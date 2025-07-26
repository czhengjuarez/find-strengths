import React from 'react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onSignInClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSignInClick }) => {
  const { user, logout, isAuthenticated } = useAuth();

  const handleSignOut = () => {
    logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-14 items-center justify-between px-4 mx-auto max-w-7xl">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold text-gray-900">Find Your Strengths</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              {user?.picture && (
                <img 
                  src={user.picture} 
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-sm font-medium text-gray-700">
                {user?.name}
              </span>
              <Button 
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="bg-white hover:bg-gray-50"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <Button 
              onClick={onSignInClick}
              variant="outline"
              size="sm"
              className="bg-white hover:bg-gray-50"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
