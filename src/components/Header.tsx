// src/components/Header.tsx

import { ChevronLeft, ChevronRight, Download, Loader2, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";

interface HeaderProps {
  currentWeek: Date;
  setCurrentWeek: (date: Date) => void;
  onDownloadPDF: () => void;
  isDownloading: boolean;
  onReset: () => void;
}

const getWeekRange = (date: Date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 4);
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startStr = start.toLocaleDateString('en-US', options);
  const endStr = end.toLocaleDateString('en-US', { ...options, year: 'numeric' });
  return `${startStr} - ${endStr}`;
};

export function Header({ currentWeek, setCurrentWeek, onDownloadPDF, isDownloading, onReset }: HeaderProps) {
  
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeek(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeek(newDate);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-white shadow-sm print-hide">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <span className="text-xl font-bold">Ops Weekly Planner</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={goToPreviousWeek}><ChevronLeft className="h-5 w-5" /></Button>
              <span className="text-sm font-medium text-gray-700 w-48 text-center">{getWeekRange(currentWeek)}</span>
              <Button variant="ghost" size="icon" onClick={goToNextWeek}><ChevronRight className="h-5 w-5" /></Button>
            </div>
            <Button variant="outline" size="sm" onClick={onReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button onClick={onDownloadPDF} disabled={isDownloading}>
              {isDownloading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Downloading...</>
              ) : (
                <><Download className="mr-2 h-4 w-4" />Download PDF</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}