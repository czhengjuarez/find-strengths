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
            <span className="text-xl font-bold text-primary">5 Levels of Problem-Solving</span>
          </div>
          <div className="flex items-center gap-2">
            {/* UPDATED: Removed explicit color classes to use the default outline style */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onReset}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            
            {/* This button retains the primary brand color style */}
            <Button 
              onClick={onDownloadPDF} 
              disabled={isDownloading} 
              size="sm"
              className="bg-[#8F1F57] text-white hover:bg-[#DD388B]"
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
