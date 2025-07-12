// src/App.tsx

import { useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { SimpleHeader } from "@/components/SimpleHeader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RotateCcw, Lightbulb } from "lucide-react";
import jsPDF from 'jspdf';

// 1. Define the structure for each level's content
const problemSolvingLevels = [
  {
    value: "level-1",
    title: "Level 1: Problem Identification",
    description: "You identify and state the problem clearly.",
    example: "Our design reviews are consistently running over time and blocking releases.",
  },
  {
    value: "level-2",
    title: "Level 2: Problem Recognition",
    description: "You diagnose the root cause of the problem.",
    example: "Our design review process is broken because we don't have clear criteria for what constitutes 'ready for review,' and we're trying to solve too many problems in these meetings.",
  },
  {
    value: "level-3",
    title: "Level 3: Multiple Solutions Considered",
    description: "You research and propose several potential solutions.",
    example: "I've identified three approaches to fix our design review process: implementing a design review checklist, splitting reviews into different types (concept vs. execution), or moving to asynchronous reviews with synchronous follow-ups. I'm not sure which would work best for our team.",
  },
  {
    value: "level-4",
    title: "Level 4: Recommended Solution",
    description: "You analyze the options and recommend the best course of action with justification.",
    example: "I recommend we implement a tiered review system with clear entry criteria. This would reduce review time by an estimated 40% and improve quality by ensuring designs are properly vetted before review.",
  },
  {
    value: "level-5",
    title: "Level 5: Solution Implemented",
    description: "You have already taken action and can report on the results.",
    example: "I've implemented the new design review process over the past month. Review times are down 35%, and designer satisfaction with the process has increased significantly. Here's what we learned and how we might optimize further.",
  },
];

// 2. Define the structure for user input
interface LevelInput {
  level: string;
  userText: string;
}

export default function App() {
  // 3. Set up state with Local Storage
  const [levelInputs, setLevelInputs] = useLocalStorage<LevelInput[]>(
    "problemSolvingInputs_v1",
    problemSolvingLevels.map(level => ({ level: level.value, userText: "" }))
  );
  const [isDownloading, setIsDownloading] = useState(false);

  // Handler to update the text for a specific level
  const handleTextChange = (levelValue: string, newText: string) => {
    setLevelInputs(prevInputs =>
      prevInputs.map(input =>
        input.level === levelValue ? { ...input, userText: newText } : input
      )
    );
  };

  // Handler to reset all inputs
  const handleReset = () => {
    if (window.confirm("Are you sure you want to clear all your entries?")) {
      setLevelInputs(problemSolvingLevels.map(level => ({ level: level.value, userText: "" })));
    }
  };

  // PDF Download Handler
  const handleDownloadPDF = () => {
    setIsDownloading(true);
    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      let y = 15;
      const margin = 15;
      const maxWidth = doc.internal.pageSize.width - margin * 2;

      const addPageIfNeeded = (spaceNeeded: number) => {
        if (y + spaceNeeded > doc.internal.pageSize.height - margin) {
          doc.addPage();
          y = margin;
        }
      };

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor("#8F1F57");
      doc.text("5 Levels of Problem-Solving", margin, y);
      y += 15;

      problemSolvingLevels.forEach((level, index) => {
        const userInput = levelInputs.find(i => i.level === level.value)?.userText || "No entry.";
        
        addPageIfNeeded(20);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor("#000000");
        doc.text(`Level ${index + 1}: ${level.title.split(': ')[1]}`, margin, y);
        y += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        const splitContent = doc.splitTextToSize(userInput, maxWidth);
        addPageIfNeeded(splitContent.length * 5 + 10);
        doc.text(splitContent, margin, y);
        y += splitContent.length * 5 + 10;
      });

      doc.save(`5-levels-problem-solving-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800">
      <SimpleHeader
        onDownloadPDF={handleDownloadPDF}
        isDownloading={isDownloading}
        onReset={handleReset}
      />
      <div className="container mx-auto max-w-4xl pt-24 pb-12 px-4"> {/* Adjusted padding for fixed header */}
        
        {/* Introduction Section */}
        <div className="mb-10 p-6 bg-white rounded-lg border">
          <p className="mb-4">The 5 levels of problem-solving framework provides a powerful structure for how you approach leadership with challenges and opportunities (Jansen & Iglesias, as cited in Corporate Rebels, 2023).</p>
          <p>Use this tool to structure your thoughts and push yourself to the highest level possible before presenting a problem.</p>
        </div>

        {/* Accordion for the 5 Levels */}
        <Accordion type="single" collapsible className="w-full" defaultValue="level-1">
          {problemSolvingLevels.map((level, index) => {
            const currentInput = levelInputs.find(i => i.level === level.value);
            return (
              <AccordionItem value={level.value} key={level.value}>
                <AccordionTrigger className="text-xl font-semibold text-primary hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">{index + 1}</span>
                    {level.title}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6 border-l-2 border-accent ml-4 pl-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Definition</h3>
                      <p className="text-muted-foreground">{level.description}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Example</h3>
                      <p className="italic bg-accent/50 p-4 rounded-md text-muted-foreground">"{level.example}"</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-secondary" />
                        Your Turn: Draft Your Statement
                      </h3>
                      <Textarea
                        placeholder={`Draft your statement for Level ${index + 1}...`}
                        className="min-h-32 text-base"
                        value={currentInput?.userText || ""}
                        onChange={(e) => handleTextChange(level.value, e.target.value)}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* Conclusion Section */}
        <div className="mt-10 text-center">
          <div className="mb-6 p-6 bg-white rounded-lg border">
            <h2 className="text-2xl font-bold text-primary mb-2">Key Insight</h2>
            <p className="text-lg">Always aim to come to leadership at the highest level possible. When someone comes to you at any level, encourage them to go one level up. This builds trust and demonstrates strategic thinking.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
