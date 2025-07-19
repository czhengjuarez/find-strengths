// src/components/SimpleHeader.tsx

import { Button } from "@/components/ui/button";
import { Download, RotateCcw, Loader2 } from "lucide-react";

interface SimpleHeaderProps {
  onDownloadPDF: () => void;
  isDownloading: boolean;
  onReset: () => void;
}

export function SimpleHeader({ onDownloadPDF, isDownloading, onReset }: SimpleHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-white shadow-sm">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            {/* UPDATED: Changed text-primary to text-gray-900 */}
            <span className="text-xl font-bold text-gray-900">XFN Kickoff Checklist</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onReset}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            
            <Button 
              onClick={onDownloadPDF} 
              disabled={isDownloading} 
              size="sm"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
