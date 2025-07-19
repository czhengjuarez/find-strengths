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
const checklistData = {
  before: {
    mainTitle: "Before the Meeting",
    subsections: [
      { id: "stakeholder-setup", title: "Stakeholder & Context Setup", items: [ "Identify key stakeholders (Design, PM, Eng, others)", "Define the core problem to be solved", "Draft a rough timeline or milestone expectations", "Clarify decision-makers and approvers" ] },
      { id: "partner-research", title: "Partner Research & Preparation", items: [ "Understand partner priorities and constraints (what they're measured on, current capacity, competing priorities)", "Research any relevant history (past collaborations, known friction points, previous project outcomes)" ] }
    ]
  },
  during: {
    mainTitle: "During the Kickoff",
    subsections: [
      { id: "goals-alignment", title: "Goals & Success Alignment", items: [ "Agree on shared goals and success criteria", "Clarify roles and responsibilities (RACI if needed)", "Set quality standards or definition of done for each discipline", "Identify what \"done\" looks like overall" ] },
      { id: "comm-process", title: "Communication & Process Setup", items: [ "Outline communication norms (sync vs async, update cadence)", "Define escalation paths (who to involve when decisions get stuck)", "Agree on change management process (how to handle scope/timeline changes)", "Establish a space for documentation (e.g. Confluence, Notion, Figma board)" ] },
    ]
  },
  after: {
    mainTitle: "After the Meeting",
    subsections: [
      { id: "doc-comm", title: "Documentation & Communication", items: [ "Summarize key decisions and next steps in writing", "Share meeting notes with all stakeholders", "Create shared project dashboard/tracker (not just documentation space, but progress visibility)" ] },
      { id: "system-setup", title: "System Setup", items: [ "Add stakeholders to relevant tools/systems (Slack channels, project boards, etc.)", "Set a reminder to check on progress at key milestones" ] },
      { id: "relationship-mgmt", title: "Ongoing Relationship Management", items: [ "Plan \"How's our collaboration going?\" checkpoint questions for ongoing projects" ] }
    ]
  },
  quickReference: {
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
  }
};

interface ChecklistItem {
  id: number;
  text: string;
  completed: boolean;
}

// --- Helper to create the initial state ---
const getInitialState = () => {
  const state: { [key: string]: ChecklistItem[] } = {};
  Object.values(checklistData).forEach(section => {
    if (section.subsections) {
      section.subsections.forEach((subsection: any) => {
        state[subsection.id] = subsection.items.map((itemText: string, index: number) => ({
          id: Date.now() + Math.random() + index,
          text: itemText,
          completed: false
        }));
      });
    }
  });
  return state;
};

const ChecklistSection = ({ title, subsections, checklistItems, newItemTexts, handleToggle, handleDelete, handleAdd, handleTextChange }: any) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-2xl font-semibold text-gray-800">{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      {subsections.map((subsection: any) => (
        <div key={subsection.id} className="border-t pt-4 first:border-t-0 first:pt-0">
          <h3 className="text-lg font-semibold mb-3">{subsection.title}</h3>
          <div className="space-y-2">
            {(checklistItems[subsection.id] || []).map((item: ChecklistItem) => (
              <div key={item.id} className="flex items-center space-x-3">
                <Checkbox id={`${subsection.id}-${item.id}`} checked={item.completed} onCheckedChange={() => handleToggle(subsection.id, item.id)} />
                {/* UPDATED: Added font-normal to the Label */}
                <Label htmlFor={`${subsection.id}-${item.id}`} className={`flex-grow text-base font-normal ${item.completed ? 'line-through text-muted-foreground' : ''}`}>{item.text}</Label>
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
);


export default function App() {
  const [checklistItems, setChecklistItems] = useLocalStorage<{ [key: string]: ChecklistItem[] }>('xfnChecklistItems_v2', getInitialState());
  const [newItemTexts, setNewItemTexts] = useState<{ [key: string]: string }>({});
  const [isDownloading, setIsDownloading] = useState(false);

  // --- Handlers ---
  const handleToggle = (listId: string, itemId: number) => { setChecklistItems(prev => ({ ...prev, [listId]: prev[listId].map(item => item.id === itemId ? { ...item, completed: !item.completed } : item) })); };
  const handleDelete = (listId: string, itemId: number) => { setChecklistItems(prev => ({ ...prev, [listId]: prev[listId].filter(item => item.id !== itemId) })); };
  const handleAdd = (listId: string) => {
    const text = newItemTexts[listId] || "";
    if (text.trim() === "") return;
    setChecklistItems(prev => ({ ...prev, [listId]: [...(prev[listId] || []), { id: Date.now(), text, completed: false }] }));
    setNewItemTexts(prev => ({ ...prev, [listId]: "" }));
  };
  const handleTextChange = (listId: string, text: string) => { setNewItemTexts(prev => ({ ...prev, [listId]: text })); };
  const handleReset = () => { if (window.confirm("Are you sure you want to reset the entire checklist?")) { setChecklistItems(getInitialState()); setNewItemTexts({}); } };

  const handleDownloadPDF = () => {
    setIsDownloading(true);
    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      let y = 15;
      const margin = 15;
      const maxWidth = doc.internal.pageSize.width - margin * 2;
      const addPageIfNeeded = (spaceNeeded: number) => { if (y + spaceNeeded > doc.internal.pageSize.height - margin) { doc.addPage(); y = margin; } };

      doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor("#8F1F57"); doc.text("XFN Kickoff Checklist", margin, y); y += 15;

      Object.values(checklistData).forEach(section => {
        if (section.subsections) {
          addPageIfNeeded(12);
          doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor("#000000"); doc.text(section.mainTitle, margin, y); y += 8;
          section.subsections.forEach((subsection: any) => {
            addPageIfNeeded(10);
            doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.text(subsection.title, margin, y); y += 6;
            doc.setFont("helvetica", "normal"); doc.setFontSize(11);
            const items = checklistItems[subsection.id] || [];
            if (items.length > 0) {
              items.forEach(item => {
                const itemStatus = item.completed ? '[x]' : '[ ]';
                const itemLines = doc.splitTextToSize(item.text, maxWidth - 10);
                addPageIfNeeded(itemLines.length * 5 + 2);
                doc.text(`${itemStatus} ${itemLines[0]}`, margin + 5, y);
                if (itemLines.length > 1) { doc.text(itemLines.slice(1), margin + 11, y + 5); y += (itemLines.length - 1) * 5; }
                y += 5;
              });
            }
            y += 4;
          });
        }
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
      <main className="container mx-auto max-w-7xl pt-24 pb-12 px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Cross-Functional Kickoff Checklist</h1>
          <p className="mt-2 text-lg text-muted-foreground">Use this checklist to align with a cross-functional partner before starting a shared initiative.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Column 1 */}
          <ChecklistSection title={checklistData.before.mainTitle} subsections={checklistData.before.subsections} {...{ checklistItems, newItemTexts, handleToggle, handleDelete, handleAdd, handleTextChange }} />
          
          {/* Column 2 */}
          <ChecklistSection title={checklistData.during.mainTitle} subsections={checklistData.during.subsections} {...{ checklistItems, newItemTexts, handleToggle, handleDelete, handleAdd, handleTextChange }} />
          
          {/* Column 3 */}
          <ChecklistSection title={checklistData.after.mainTitle} subsections={checklistData.after.subsections} {...{ checklistItems, newItemTexts, handleToggle, handleDelete, handleAdd, handleTextChange }} />
        </div>

        {/* UPDATED: Quick Reference section is now full-width at the bottom */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-gray-800">{checklistData.quickReference.mainTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {checklistData.quickReference.items.map((item: any) => (
              <div key={item.title}>
                <h3 className="font-semibold">{item.title}:</h3>
                <p className="text-muted-foreground">{item.question}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
