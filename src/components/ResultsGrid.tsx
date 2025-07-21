import React, { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Edit, Loader2 } from "lucide-react";
import type { ProcessedCapability } from "../types";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Props {
  results: ProcessedCapability[];
  onEdit: () => void;
}

const Quadrant = ({ title, description, items, bgColor }: { title: string; description: React.ReactNode; items: ProcessedCapability[]; bgColor: string; }) => (
  <div className={`p-4 border rounded-lg ${bgColor} flex flex-col`}>
    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    <p className="text-sm text-muted-foreground mt-1 mb-3">{description}</p>
    <div className="flex flex-wrap gap-2 mt-auto pt-2">
      {items.length > 0 ? (
        items.map(item => <Badge key={item.id} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">{item.text}</Badge>)
      ) : (
        <p className="text-sm text-muted-foreground">None</p>
      )}
    </div>
  </div>
);

export function ResultsGrid({ results, onEdit }: Props) {
  const [isDownloading, setIsDownloading] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const threshold = Math.ceil(results.length / 2);

  const handleDownloadPDF = () => {
    const input = gridRef.current;
    if (!input) return;

    setIsDownloading(true);

    // Use the element's full scroll width to ensure everything is captured
    const options = {
      scale: 2,
      width: input.scrollWidth,
      height: input.scrollHeight,
      useCORS: true,
    };

    html2canvas(input, options)
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('landscape', 'mm', 'a4'); // Use standard A4 landscape
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const imgWidth = imgProps.width;
        const imgHeight = imgProps.height;
        const ratio = imgWidth / imgHeight;

        let newWidth = pdfWidth - 20; // 10mm margins
        let newHeight = newWidth / ratio;

        if (newHeight > pdfHeight - 20) {
          newHeight = pdfHeight - 20;
          newWidth = newHeight * ratio;
        }
        
        const x = (pdfWidth - newWidth) / 2;
        const y = (pdfHeight - newHeight) / 2;

        pdf.addImage(imgData, 'PNG', x, y, newWidth, newHeight);
        pdf.save(`strengths-matrix-${new Date().toISOString().split('T')[0]}.pdf`);
      })
      .finally(() => {
        setIsDownloading(false);
      });
  };

  const strengths = results.filter(r => r.enjoymentRank < threshold && r.skillRank < threshold);
  const hiddenStrengths = results.filter(r => r.enjoymentRank < threshold && r.skillRank >= threshold);
  const drainingStrengths = results.filter(r => r.enjoymentRank >= threshold && r.skillRank < threshold);
  const weaknesses = results.filter(r => r.enjoymentRank >= threshold && r.skillRank >= threshold);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle className="text-3xl font-bold text-gray-900">Your Strengths Matrix</CardTitle>
          <CardDescription className="text-lg mt-2">
            Here's the breakdown of your capabilities based on your rankings.
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" /> Edit
          </Button>
          <Button onClick={handleDownloadPDF} disabled={isDownloading}>
            {isDownloading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Download
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={gridRef} className="p-2 bg-card">
            <div className="grid grid-cols-2 gap-4">
                <Quadrant title="Natural Strengths" description="Skills you are good at and enjoy using. These are your core strengths and should be leveraged more." items={strengths} bgColor="bg-green-50" />
                <Quadrant title="Potential Strengths" description="Skills you enjoy but haven’t mastered yet. These represent development opportunities." items={hiddenStrengths} bgColor="bg-blue-50" />
                <Quadrant title="Fragile Strengths" description="Skills you are good at but do not enjoy. These may be necessary for your role but could lead to burnout if overused." items={drainingStrengths} bgColor="bg-yellow-50" />
                <Quadrant title="Resistant Limitations" description={<>Skills you neither enjoy nor excel at. These may be areas to delegate, minimize, or improve only if essential. <i className="mt-2 block not-italic text-slate-500">I strongly suggest you pair with a peer to work on tasks in this area. It doesn't mean that you always delegate things you don't like to others, instead, it is to find someone whose natural strength lends itself to these capabilities.</i></>} items={weaknesses} bgColor="bg-red-50" />
            </div>
        </div>

        <details className="mt-8 bg-slate-100 p-4 rounded-lg">
          <summary className="cursor-pointer font-semibold text-sm">Show Raw Data to see how we calculate</summary>
          <div className="mt-2">
            <p className="text-xs text-muted-foreground">Threshold for "High" (index less than): {threshold}</p>
            <pre className="mt-2 p-2 bg-white rounded text-xs overflow-x-auto">{JSON.stringify(results, null, 2)}</pre>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}