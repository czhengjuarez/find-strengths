import React from 'react';
import { Button } from './ui/button';
import { Clock, Save } from 'lucide-react';

interface GuestSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: () => void;
  onProceedAsGuest: () => void;
}

export const GuestSaveModal: React.FC<GuestSaveModalProps> = ({
  isOpen,
  onClose,
  onSignIn,
  onProceedAsGuest,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full">
          <Save className="w-6 h-6 text-blue-600" />
        </div>
        
        <h2 className="text-xl font-semibold text-center text-gray-900 mb-2">
          Save Your List
        </h2>
        
        <p className="text-gray-600 text-center mb-6">
          Choose how you'd like to save your capabilities list:
        </p>
        
        <div className="space-y-4">
          {/* Sign In Option */}
          <div className="border-l-4 border-primary bg-accent p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">
                  Sign In & Save Permanently
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Create an account or sign in to save your list permanently. Access it anytime, anywhere.
                </p>
                <button
                  onClick={onSignIn}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Sign In to Save
                </button>
              </div>
            </div>
          </div>
          
          {/* Guest Option */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">
                  Continue as Guest
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Your list will be temporarily saved for this session only. It will be cleared when you close the browser.
                </p>
                <Button 
                  onClick={onProceedAsGuest}
                  variant="outline"
                  className="w-full"
                >
                  Continue as Guest
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
