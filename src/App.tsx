// src/App.tsx

import { useState } from "react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import jsPDF from 'jspdf';
import { XCircle, PlusCircle } from "lucide-react";

// --- Data Structure for the Checklist ---
const checklistData = [
  {
    mainTitle: "Before the Meeting",
    subsections: [
      { id: "stakeholder-setup", title: "Stakeholder & Context Setup", items: [ "Identify key stakeholders (Design, PM, Eng, others)", "Define the core problem to be solved", "Draft a rough timeline or milestone expectations", "Clarify decision-makers and approvers" ] },
      { id: "partner-research", title: "Partner Research & Preparation", items: [ "Understand partner priorities and constraints (what they're measured on, current capacity, competing priorities)", "Research any relevant history (past collaborations, known friction points, previous project outcomes)" ] }
    ]
  },
  {
    mainTitle: "During the Kickoff",
    subsections: [
      { id: "goals-alignment", title: "Goals & Success Alignment", items: [ "Agree on shared goals and success criteria", "Clarify roles and responsibilities (RACI if needed)", "Set quality standards or definition of done for each discipline", "Identify what \"done\" looks like overall" ] },
      { id: "comm-process", title: "Communication & Process Setup", items: [ "Outline communication norms (sync vs async, update cadence)", "Define escalation paths (who to involve when decisions get stuck)", "Agree on change management process (how to handle scope/timeline changes)", "Establish a space for documentation (e.g. Confluence, Notion, Figma board)" ] },
      { id: "deps-resources", title: "Dependencies & Resources", items: [ "Discuss risks, assumptions, and constraints", "Identify dependencies (what this project depends on, what depends on this project)", "Discuss resource allocation (time commitments, tool access, budget if relevant)" ] },
      { id: "meeting-planning", title: "Meeting Planning", items: [ "Schedule follow-up or check-in meetings", "Schedule a retrospective at project completion (to improve future collaborations)" ] }
    ]
  },
  {
    mainTitle: "After the Meeting",
    subsections: [
      { id: "doc-comm", title: "Documentation & Communication", items: [ "Summarize key decisions and next steps in writing", "Share meeting notes with all stakeholders", "Create shared project dashboard/tracker (not just documentation space, but progress visibility)" ] },
      { id: "system-setup", title: "System Setup", items: [ "Add stakeholders to relevant tools/systems (Slack channels, project boards, etc.)", "Set a reminder to check on progress at key milestones" ] },
      { id: "relationship-mgmt", title: "Ongoing Relationship Management", items: [ "Plan \"How's our collaboration going?\" checkpoint questions for ongoing projects" ] }
    ]
  }
];

const quickReferenceData = {
  mainTitle: "Quick Reference: Key Questions to Answer",
  items: [
    { title: "Goals", question: "What are we trying to achieve and how will we know we succeeded?" },
    { title: "Roles", question: "Who does what, and who makes final decisions?" },
    { title: "Communication", question: "How often do we sync, and through what channels?" },
    { title: "Dependencies", question: "What do we need from others, and what do others need from us?" },
    { title: "Quality", question: "What does \"good enough\" vs \"excellent\" look like for each discipline?" },
    { title: "Changes", question: "How do we handle scope creep or timeline shifts?" },
    { title: "Escalation", question: "Who do we involve when we're stuck?" }
  ]
};

interface ChecklistItem {
  id: number;
  text: string;
  completed: boolean;
}

// --- Helper to create the initial state ---
const getInitialState = () => {
  const state: { [key: string]: ChecklistItem[] } = {};
  checklistData.forEach(section => {
    section.subsections.forEach(subsection => {
      state[subsection.id] = subsection.items.map((itemText, index) => ({
        id: Date.now() + index,
        text: itemText,
        completed: false
      }));
    });
  });
  return state;
};

export default function App() {
  const [checklistItems, setChecklistItems] = useLocalStorage<{ [key: string]: ChecklistItem[] }>('xfnChecklistItems_v1', getInitialState());
  const [newItemTexts, setNewItemTexts] = useState<{ [key: string]: string }>({});
  const [isDownloading, setIsDownloading] = useState(false);

  // --- Handlers ---
  const handleToggle = (listId: string, itemId: number) => {
    setChecklistItems(prev => ({
      ...prev,
      [listId]: prev[listId].map(item => item.id === itemId ? { ...item, completed: !item.completed } : item)
    }));
  };

  const handleDelete = (listId: string, itemId: number) => {
    setChecklistItems(prev => ({
      ...prev,
      [listId]: prev[listId].filter(item => item.id !== itemId)
    }));
  };

  const handleAdd = (listId: string) => {
    const text = newItemTexts[listId] || "";
    if (text.trim() === "") return;
    const newItem: ChecklistItem = { id: Date.now(), text, completed: false };
    setChecklistItems(prev => ({
      ...prev,
      [listId]: [...(prev[listId] || []), newItem]
    }));
    setNewItemTexts(prev => ({ ...prev, [listId]: "" }));
  };

  const handleTextChange = (listId: string, text: string) => {
    setNewItemTexts(prev => ({ ...prev, [listId]: text }));
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset the entire checklist?")) {
      setChecklistItems(getInitialState());
      setNewItemTexts({});
    }
  };

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
      doc.text("XFN Kickoff Checklist", margin, y);
      y += 15;

      checklistData.forEach(section => {
        addPageIfNeeded(12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor("#000000");
        doc.text(section.mainTitle, margin, y);
        y += 8;

        section.subsections.forEach(subsection => {
          addPageIfNeeded(10);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.text(subsection.title, margin, y);
          y += 6;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(11);
          const items = checklistItems[subsection.id] || [];
          if (items.length > 0) {
            items.forEach(item => {
              const itemStatus = item.completed ? '[x]' : '[ ]';
              const itemLines = doc.splitTextToSize(item.text, maxWidth - 10);
              addPageIfNeeded(itemLines.length * 5 + 2);
              doc.text(`${itemStatus} ${itemLines[0]}`, margin + 5, y);
              if (itemLines.length > 1) {
                doc.text(itemLines.slice(1), margin + 11, y + 5);
                y += (itemLines.length - 1) * 5;
              }
              y += 5;
            });
          }
          y += 4;
        });
      });

      doc.save(`xfn-kickoff-checklist-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800">
      <Header onDownloadPDF={handleDownloadPDF} isDownloading={isDownloading} onReset={handleReset} />
      <main className="container mx-auto max-w-4xl pt-24 pb-12 px-4">
        <div className="text-center mb-8">
          {/* UPDATED: Changed text-4xl to text-3xl */}
          <h1 className="text-3xl font-bold text-gray-900">Cross-Functional Kickoff Checklist</h1>
          <p className="mt-2 text-lg text-muted-foreground">Use this checklist to align with a cross-functional partner before starting a shared initiative.</p>
        </div>

        <div className="space-y-8">
          {checklistData.map(section => (
            <Card key={section.mainTitle}>
              <CardHeader>
                <CardTitle className="text-2xl font-semibold text-gray-800">{section.mainTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {section.subsections.map(subsection => (
                  <div key={subsection.id} className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-3">{subsection.title}</h3>
                    <div className="space-y-2">
                      {(checklistItems[subsection.id] || []).map(item => (
                        <div key={item.id} className="flex items-center space-x-3">
                          <Checkbox id={`${subsection.id}-${item.id}`} checked={item.completed} onCheckedChange={() => handleToggle(subsection.id, item.id)} />
                          <Label htmlFor={`${subsection.id}-${item.id}`} className={`flex-grow text-base ${item.completed ? 'line-through text-muted-foreground' : ''}`}>{item.text}</Label>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(subsection.id, item.id)}>
                            <XCircle className="h-4 w-4 text-gray-400 hover:text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center space-x-2 pt-3 mt-2">
                      <Input 
                        placeholder="Add your own item..." 
                        value={newItemTexts[subsection.id] || ""}
                        onChange={(e) => handleTextChange(subsection.id, e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd(subsection.id)}
                      />
                      <Button onClick={() => handleAdd(subsection.id)} size="sm"><PlusCircle className="h-4 w-4 mr-2" />Add</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-gray-800">{quickReferenceData.mainTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {quickReferenceData.items.map(item => (
                <div key={item.title}>
                  <h3 className="font-semibold">{item.title}:</h3>
                  <p className="text-muted-foreground">{item.question}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
